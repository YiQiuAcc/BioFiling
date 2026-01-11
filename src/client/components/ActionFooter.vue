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
          variant="outline"
          class="ml-2"
          @click="handleDownload"
        >
          <template #icon><download-icon /></template>
          下载文档
        </t-button>

        <template v-if="authStore.isAdmin">
          <t-button
            theme="danger"
            size="large"
            class="ml-2"
            @click="emit('audit', 'REJECTED')"
          >
            <template #icon><close-circle-icon /></template>
            驳回
          </t-button>
          <t-button
            theme="success"
            size="large"
            class="ml-2"
            @click="emit('audit', 'APPROVED')"
          >
            <template #icon><check-circle-icon /></template>
            通过
          </t-button>
        </template>
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
          @confirm="emit('reset')"
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
          @click="emit('submit')"
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
import {
  CheckCircleIcon,
  CloseCircleIcon,
  DownloadIcon,
  FileRestoreIcon,
  SaveIcon,
} from 'tdesign-icons-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useFilingStore } from '@/stores/filing'

const emit = defineEmits(['submit', 'reset', 'audit'])
const props = defineProps<{
  isPreviewMode: boolean
}>()

const router = useRouter()
const authStore = useAuthStore()
const filingStore = useFilingStore()

// === 数据填充逻辑 ===
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
