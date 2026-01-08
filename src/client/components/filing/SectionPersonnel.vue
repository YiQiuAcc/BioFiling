<template>
  <div id="section-personnel" class="form-section">
    <t-card title="实验室准入人员" :bordered="false" header-bordered>
      <template #actions>
        <t-button
          v-if="!readonly"
          variant="dashed"
          theme="primary"
          @click="handleAddPerson"
        >
          <template #icon><add-icon /></template>
          新增人员
        </t-button>
      </template>
      <div class="table-container">
        <t-table
          row-key="key"
          :data="formData.personnel"
          :columns="dynamicColumns"
          bordered
          hover
          size="medium"
        >
          <template #department="{ row }">
            <t-input
              v-model="row.department"
              placeholder="请输入"
              :readonly="readonly"
            />
          </template>

          <template #name="{ row }">
            <t-input
              v-model="row.name"
              placeholder="请输入"
              :readonly="readonly"
            />
          </template>

          <template #id="{ row }">
            <t-input
              v-model="row.id"
              placeholder="请输入"
              :readonly="readonly"
            />
          </template>

          <template #phone="{ row }">
            <t-input
              v-model="row.phone"
              placeholder="请输入"
              :readonly="readonly"
            />
          </template>

          <template #content="{ row }">
            <t-input
              v-model="row.content"
              placeholder="简述内容"
              :readonly="readonly"
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
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { MessagePlugin } from 'tdesign-vue-next'
import { AddIcon, DeleteIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'

const store = useFilingStore()
const { formData } = storeToRefs(store)

const props = defineProps<{
  readonly?: boolean
}>()

// 定义列结构
const baseColumns = [
  { colKey: 'department', title: '院系', width: 140 }, // 稍微调宽一点方便输入
  { colKey: 'name', title: '姓名', width: 100 },
  { colKey: 'id', title: '工号/学号', width: 130 },
  { colKey: 'phone', title: '联系电话', width: 140 },
  { colKey: 'content', title: '实验内容', ellipsis: true },
]

// 动态计算列：如果是只读模式，不显示操作列
const dynamicColumns = computed(() => {
  if (props.readonly) {
    return baseColumns
  }
  return [
    ...baseColumns,
    { colKey: 'op', title: '操作', width: 60, fixed: 'right' as const },
  ]
})

// 生成唯一 Key
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const handleAddPerson = () => {
  formData.value.personnel.push({
    key: generateId(),
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
  } else {
    MessagePlugin.warning('至少需要保留一名人员信息')
  }
}
</script>
