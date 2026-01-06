<template>
  <div class="bottom-action-bar">
    <div class="action-content">
      <div class="action-buttons">
        <t-button
          theme="default"
          variant="outline"
          size="large"
          @click="handleReset"
        >
          重置
        </t-button>

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
import { MessagePlugin } from 'tdesign-vue-next'
import { SaveIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'

// 定义事件
const emit = defineEmits(['submit', 'reset'])

const filingStore = useFilingStore()

const emitSubmit = () => {
  // 仅仅通知父组件：“用户点提交了，你看着办”
  emit('submit')
}

const handleReset = () => {
  const confirm = window.confirm('确定要重置所有已填写的内容吗？')
  if (confirm) {
    filingStore.resetForm()
    emit('reset') // 通知父组件清除验证错误状态
    MessagePlugin.success('表单已重置')
  }
}
</script>
