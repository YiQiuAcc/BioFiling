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
          @click="filingStore.resetForm"
          class="btn-reset"
        >
          重置
        </t-button>
        <t-button
          theme="primary"
          size="large"
          :loading="filingStore.submitting"
          @click="filingStore.triggerSubmit"
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
import { SaveIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'

const filingStore = useFilingStore()
</script>
