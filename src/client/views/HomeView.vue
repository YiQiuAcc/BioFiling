<template>
  <div class="home-container" style="padding: 24px">
    <t-row justify="space-between" align="center" class="mb-4">
      <t-col>
        <h2 class="title">我的备案记录</h2>
        <p class="desc text-secondary">
          查看您的实验室生物安全备案状态及历史记录
        </p>
      </t-col>
      <t-col>
        <t-button theme="primary" @click="$router.push('/create')">
          <template #icon><add-icon /></template>
          新建备案
        </t-button>
      </t-col>
    </t-row>

    <div v-if="loading" class="mt-5 text-center">
      <t-loading text="加载数据中..." size="medium" />
    </div>

    <div v-else>
      <t-empty
        v-if="records.length === 0"
        title="暂无备案记录"
        description="您尚未提交任何生物安全备案申请"
      >
        <template #action>
          <t-button theme="primary" @click="$router.push('/create')">
            立即开始填报
          </t-button>
        </template>
      </t-empty>

      <t-card v-else :bordered="false">
        <t-table
          row-key="id"
          :data="records"
          :columns="columns"
          :hover="true"
          stripe
        >
          <template #status="{ row }">
            <t-tag :theme="getStatusTheme(row.status)" variant="light">
              {{ row.status || '审核中' }}
            </t-tag>
          </template>

          <template #createdAt="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString() }}
          </template>

          <template #op="{ row }">
            <t-space>
              <t-link theme="primary" @click="handleDownload(row)">
                <download-icon slot="prefix-icon" />
                下载文档
              </t-link>
            </t-space>
          </template>
        </t-table>
      </t-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { AddIcon, DownloadIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'

const store = useFilingStore()
const { records, loading } = storeToRefs(store)

// 表格列定义
const columns = [
  { colKey: 'projectName', title: '项目名称', ellipsis: true },
  { colKey: 'leaderName', title: '负责人', width: 120 },
  { colKey: 'department', title: '所属院系', width: 150 },
  { colKey: 'status', title: '状态', width: 120 },
  { colKey: 'createdAt', title: '提交日期', width: 120 },
  { colKey: 'op', title: '操作', width: 120, fixed: 'right' as const },
]

// 状态样式映射
const getStatusTheme = (status: string) => {
  switch (status) {
    case '已通过':
      return 'success'
    case '驳回':
      return 'danger'
    default:
      return 'warning'
  }
}

const handleDownload = (row: any) => {
  store.downloadRecordDoc(row.id, row.projectName)
}

onMounted(() => {
  store.fetchRecords()
})
</script>

<style scoped>
.title {
  margin-bottom: 4px;
  font-weight: 600;
}

.text-secondary {
  color: var(--td-text-color-secondary);
  font-size: 14px;
}
</style>
