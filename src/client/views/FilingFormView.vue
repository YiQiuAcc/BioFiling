<template>
  <div class="filing-container">
    <t-alert theme="warning" class="mt-4 mb-3">
      <template #icon><info-circle-icon /></template>
      申报说明：请在线填写并提交，审核通过后需打印系统生成的docx文件
      <b>一式两份</b>
      ，签字盖章后提交。
    </t-alert>

    <t-form label-align="top" class="main-form" scroll-to-first-error="smooth">
      <section-basic class="section-basic" />
      <section-personnel class="section-personnel" />
      <section-risk class="section-risk" />
      <section-location class="section-location" />
      <section-content class="section-content" />
      <section-files class="section-files" />
    </t-form>


    <Teleport to="body">
      <action-footer @submit="handleFormSubmit" @reset="handleFormReset" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { InfoCircleIcon } from 'tdesign-icons-vue-next'
import { useForm } from 'vee-validate'
import { useFilingStore } from '@/stores/filing'
import ActionFooter from '@/components/ActionFooter.vue'
// 假设路径

// 引入子组件
import SectionBasic from '@/components/filing/SectionBasic.vue'
import SectionContent from '@/components/filing/SectionContent.vue'
import SectionFiles from '@/components/filing/SectionFiles.vue'
import SectionLocation from '@/components/filing/SectionLocation.vue'
import SectionPersonnel from '@/components/filing/SectionPersonnel.vue'
import SectionRisk from '@/components/filing/SectionRisk.vue'
import { formDataSchemaTyped } from '@/types/index'

const filingStore = useFilingStore()
const { formData } = storeToRefs(filingStore)

// === 初始化表单验证上下文 ===
const {
  validate,
  setValues,
  resetForm,
  errors: _,
} = useForm({
  validationSchema: formDataSchemaTyped,
})

// === 处理提交 ===
const handleFormSubmit = async () => {
  // 提交前强制同步一次值。
  filingStore.syncFilesToFormData()
  // 将 Pinia 的最新数据同步给 VeeValidate
  setValues(formData.value)
  // 触发验证
  const result = await validate()

  if (result.valid) {
    // 验证通过，调用 Store 的 API 提交逻辑
    await filingStore.triggerSubmit()
  } else {
    if (result.errors) return
    // 验证失败
    console.log('表单验证失败', result.errors)
    // 滚动到第一个错误
    scrollToFirstError(result.errors)
  }
}

// === 处理重置 ===
const handleFormReset = () => {
  // 重置验证状态
  resetForm()
}

// 滚动到错误位置
const scrollToFirstError = (errors: Record<string, string>) => {
  const firstErrorKey = Object.keys(errors)[0]
  if (firstErrorKey) {
    // 根据错误字段名称确定对应的部分
    let sectionSelector = ''

    if (firstErrorKey.startsWith('basicInfo')) {
      sectionSelector = '.section-basic'
    } else if (firstErrorKey.startsWith('personnel')) {
      sectionSelector = '.section-personnel'
    } else if (firstErrorKey.startsWith('riskAssessment')) {
      sectionSelector = '.section-risk'
    } else if (firstErrorKey.startsWith('location')) {
      sectionSelector = '.section-location'
    } else if (firstErrorKey.startsWith('content')) {
      sectionSelector = '.section-content'
    } else if (firstErrorKey.startsWith('files')) {
      sectionSelector = '.section-files'
    }

    // 如果找到了对应的区域，就滚动到该区域
    if (sectionSelector) {
      const sectionEl = document.querySelector(sectionSelector)
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    // 如果没有找到特定区域，尝试直接定位到错误元素
    let selector = `[name="${firstErrorKey}"]`
    const el = document.querySelector(selector)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      // 如果找不到具体的元素，滚动到顶部作为兜底
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>
