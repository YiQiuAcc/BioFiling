<template>
  <div class="app-layout" :class="appStore.mode">
    <div class="main-wrapper">
      <div class="content-container">
        <app-header />

        <div :style="isFilingForm ? 'padding-bottom: 60px' : ''">
          <router-view v-slot="{ Component }">
            <transition name="slide-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>

      <div v-if="isFilingForm" class="anchor-sidebar">
        <t-anchor :bounds="100" :target-offset="100">
          <t-anchor-item href="#section-basic" title="基本信息" />
          <t-anchor-item href="#section-personnel" title="准入人员" />
          <t-anchor-item href="#section-risk" title="风险评估" />
          <t-anchor-item href="#section-location" title="地点时间" />
          <t-anchor-item href="#section-content" title="设施内容" />
          <t-anchor-item href="#section-files" title="补充文件" />
        </t-anchor>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const appStore = useAppStore()
// 路由名为 FilingCreate 时才是填报页
const isFilingForm = computed(() => route.name === 'FilingCreate')
</script>
