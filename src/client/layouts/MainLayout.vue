<template>
  <div class="app-layout" :class="appStore.mode">
    <div class="main-wrapper">
      <div class="content-container">
        <app-header />

        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>

      <div v-if="isfilingPage" class="anchor-sidebar">
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

    <action-footer v-if="isfilingPage" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import ActionFooter from '@/components/ActionFooter.vue'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const appStore = useAppStore()

const isfilingPage = computed(() => route.name === 'Home')
</script>
