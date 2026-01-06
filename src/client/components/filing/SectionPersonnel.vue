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
          <template #department="{ row, rowIndex }">
            <t-input
              v-model="row.department"
              placeholder="院系"
              variant="outline"
              size="small"
              :status="getError(rowIndex, 'department') ? 'error' : 'default'"
            />
          </template>
          <template #name="{ row, rowIndex }">
            <t-input
              v-model="row.name"
              placeholder="姓名"
              variant="outline"
              size="small"
              :status="getError(rowIndex, 'name') ? 'error' : 'default'"
            />
          </template>
          <template #id="{ row, rowIndex }">
            <t-input
              v-model="row.id"
              placeholder="工号"
              variant="outline"
              size="small"
              :status="getError(rowIndex, 'id') ? 'error' : 'default'"
            />
          </template>
          <template #phone="{ row, rowIndex }">
            <t-input
              v-model="row.phone"
              placeholder="电话"
              variant="outline"
              size="small"
              :status="getError(rowIndex, 'phone') ? 'error' : 'default'"
            />
          </template>
          <template #content="{ row, rowIndex }">
            <t-input
              v-model="row.content"
              placeholder="实验内容"
              variant="outline"
              size="small"
              :status="getError(rowIndex, 'content') ? 'error' : 'default'"
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
        <div
          v-if="errors.personnel"
          class="t-is-error t-input__extra"
          style="color: var(--td-error-color); margin-top: 8px"
        >
          {{ errors.personnel }}
        </div>
      </div>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { AddIcon, DeleteIcon } from 'tdesign-icons-vue-next'
import { useFormErrors } from 'vee-validate'
import { useFilingStore } from '@/stores/filing'

const store = useFilingStore()
const { formData } = storeToRefs(store)
const errors = useFormErrors()

// 获取特定行的错误
const getError = (index: number, field: string) => {
  return errors.value[`personnel[${index}].${field}`]
}

const personnelColumns = [
  { colKey: 'department', title: '院系', width: 110 },
  { colKey: 'name', title: '姓名', width: 90 },
  { colKey: 'id', title: '工号/学号', width: 110 },
  { colKey: 'phone', title: '联系电话', width: 120 },
  { colKey: 'content', title: '实验内容', ellipsis: true },
  { colKey: 'op', title: '操作', width: 60, fixed: 'right' as const },
]

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

const handleDeletePerson = (index: number) => {
  if (formData.value.personnel.length > 1) {
    formData.value.personnel.splice(index, 1)
  }
}
</script>
