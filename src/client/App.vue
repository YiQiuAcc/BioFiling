<template>
  <t-config-provider :global-config="globalConfig">
    <router-view />
  </t-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { GlobalConfigProvider } from 'tdesign-vue-next'
import { merge } from 'lodash-es'
import zhConfig from 'tdesign-vue-next/es/locale/zh_CN'
import { useAppStore } from '@/stores/app'

const empty: GlobalConfigProvider = {}
const globalConfig: GlobalConfigProvider = merge(empty, zhConfig)

const appStore = useAppStore()

onMounted(() => {
  appStore.initTheme()
})
</script>
