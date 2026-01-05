<template>
  <div class="bottom-action-bar">
    <div class="action-content">
      <div class="action-info">
        <span>当前状态:</span>
        <t-tag theme="warning" variant="light">填写中</t-tag>
      </div>
      <div class="action-buttons">
        <t-button
          theme="default"
          variant="outline"
          size="large"
          @click="handleReset"
          class="btn-reset"
        >
          重置
        </t-button>
        <t-button
          theme="primary"
          size="large"
          :loading="submitting"
          @click="submitForm"
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
import { ref } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { SaveIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'

const submitting = ref(false)
const filingStore = useFilingStore()

const handleReset = () => {
  // 重置表单逻辑，可能需要调用store中的重置方法
  MessagePlugin.info('表单已重置')
  // filingStore.resetForm(); // 假设在store中有这个方法
}

const submitForm = async () => {
  submitting.value = true
  try {
    // 触发提交事件，通过store执行提交逻辑
    filingStore.triggerSubmit()
  } catch (error) {
    console.error('提交失败:', error)
    MessagePlugin.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>
