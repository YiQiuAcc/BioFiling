<template>
  <div class="bottom-action-bar">
    <div class="action-content">
      <div v-if="isPreviewMode" class="action-buttons">
        <t-button theme="default" size="large" @click="router.back()">
          返回列表
        </t-button>
        <t-button
          theme="primary"
          size="large"
          class="ml-2"
          @click="handleDownload"
        >
          <template #icon><download-icon /></template>
          下载文档
        </t-button>
      </div>
      <div v-else class="action-buttons">
        <t-button
          theme="default"
          variant="outline"
          size="large"
          @click="handleFillMockData"
        >
          填充模拟数据
        </t-button>
        <t-popconfirm
          content="确定要重置所有已填写的内容吗？"
          @confirm="handleReset"
        >
          <t-button theme="default" variant="outline" size="large">
            <template #icon>
              <file-restore-icon style="color: inherit" :stroke-width="2" />
            </template>
            重置
          </t-button>
        </t-popconfirm>
        <t-button
          theme="primary"
          size="large"
          :loading="filingStore.submitting"
          @click="emitSubmit"
          class="btn-submit"
        >
          <template #icon><save-icon /></template>
          提交备案
        </t-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { SaveIcon } from 'tdesign-icons-vue-next'
import { DownloadIcon, FileRestoreIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'

// 定义事件
const emit = defineEmits(['submit', 'reset'])

const props = defineProps<{
  isPreviewMode: boolean
}>()

const filingStore = useFilingStore()
const router = useRouter()
const emitSubmit = () => {
  // 仅通知父组件
  emit('submit')
}

const handleReset = () => {
  filingStore.resetForm()
  emit('reset') // 通知父组件清除验证错误状态
  MessagePlugin.success('表单已重置')
}

const handleFillMockData = () => {
  filingStore.fillWithMockData()
  MessagePlugin.success('模拟数据已填充')
}

// === 预览模式下的下载操作 ===
const handleDownload = () => {
  if (filingStore.currentRecord) {
    filingStore.downloadRecordDoc(
      filingStore.currentRecord.id,
      filingStore.formData.projectName,
    )
  }
}
</script>
