<template>
  <header class="page-header">
    <div class="header-content">
      <div class="brand-info">
        <div class="logo-box">BIO</div>
        <div class="title-text">
          <h1>生物安全实验室管理系统</h1>
          <p>资产与实验室管理处 · 生物安全备案</p>
        </div>
      </div>
      <div class="header-actions">
        <t-button
          v-if="authStore.isAdmin"
          theme="default"
          variant="outline"
          size="large"
          @click="handleBatchExport"
          :loading="exporting"
        >
          <template #icon><download-icon /></template>
          批量导出备案表
        </t-button>

        <t-switch
          size="large"
          :value="appStore.isDarkMode"
          :label="['暗', '亮']"
          @change="appStore.toggleTheme()"
        >
          <template #label="{ value }">
            <moon-icon v-if="value" />
            <sunny-icon v-else />
          </template>
        </t-switch>
        <t-tag theme="primary" variant="outline" size="large" shape="round">
          {{ currentYear }} 年度
        </t-tag>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { DownloadIcon, MoonIcon, SunnyIcon } from 'tdesign-icons-vue-next'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { downloadBlob, filingAPI } from '@/api'

const currentYear = new Date().getFullYear()
const appStore = useAppStore()
const exporting = ref(false)

const authStore = useAuthStore()
// 批量导出
const handleBatchExport = async () => {
  if (!authStore.isAdmin) return
  exporting.value = true
  try {
    const response = await filingAPI.exportAll()

    let filename = `生物安全备案汇总_${currentYear}.zip`
    const disposition = response.headers['content-disposition']
    if (disposition && disposition.indexOf('filename*=') !== -1) {
      filename = decodeURIComponent(disposition.split("filename*=utf-8''")[1])
    }

    downloadBlob(response.data, filename)
    MessagePlugin.success('批量导出成功')
  } catch (error) {
    console.error(error)
    MessagePlugin.error('导出失败，请检查权限')
  } finally {
    exporting.value = false
  }
}
</script>
