<template>
  <div id="section-personnel" class="form-section">
    <t-card title="实验室准入人员" :bordered="false" header-bordered>
      <template #actions>
        <t-button variant="dashed" theme="primary" @click="handleAddPerson">
          <template #icon><add-icon /></template>
          新增人员
        </t-button>
      </template>
      <div class="table-container">
        <t-table
          row-key="key"
          :data="formData.personnel"
          :columns="personnelColumns"
          bordered
          hover
          size="medium"
        >
          <template #department="{ row }">
            <t-input
              v-model="row.department"
              placeholder="院系"
              variant="outline"
              size="small"
            />
          </template>
          <template #name="{ row }">
            <t-input
              v-model="row.name"
              placeholder="姓名"
              variant="outline"
              size="small"
            />
          </template>
          <template #id="{ row }">
            <t-input
              v-model="row.id"
              placeholder="工号"
              variant="outline"
              size="small"
            />
          </template>
          <template #phone="{ row }">
            <t-input
              v-model="row.phone"
              placeholder="电话"
              variant="outline"
              size="small"
            />
          </template>
          <template #content="{ row }">
            <t-input
              v-model="row.content"
              placeholder="实验内容"
              variant="outline"
              size="small"
            />
          </template>
          <template #op="{ rowIndex }">
            <t-button
              theme="danger"
              variant="text"
              shape="circle"
              @click="handleDeletePerson(rowIndex)"
              :disabled="formData.personnel.length <= 1"
            >
              <delete-icon />
            </t-button>
          </template>
        </t-table>
      </div>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { AddIcon, DeleteIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'

const store = useFilingStore()
const { formData } = storeToRefs(store)

// 定义列配置
const personnelColumns = [
  { colKey: 'department', title: '院系', width: 110 },
  { colKey: 'name', title: '姓名', width: 90 },
  { colKey: 'id', title: '工号/学号', width: 110 },
  { colKey: 'phone', title: '联系电话', width: 120 },
  { colKey: 'content', title: '实验内容', ellipsis: true },
  { colKey: 'op', title: '操作', width: 60, fixed: 'right' as const },
]

// 添加人员
const handleAddPerson = () => {
  formData.value.personnel.push({
    key: crypto.randomUUID(),
    department: '',
    name: '',
    id: '',
    phone: '',
    content: '',
  })
}

// 删除人员
const handleDeletePerson = (index: number) => {
  if (formData.value.personnel.length > 1) {
    formData.value.personnel.splice(index, 1)
  }
}
</script>
