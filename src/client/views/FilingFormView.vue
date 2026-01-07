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
import { nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { InfoCircleIcon } from 'tdesign-icons-vue-next'
import { useForm } from 'vee-validate'
import { useFilingStore } from '@/stores/filing'
import router from '@/router/router'
import ActionFooter from '@/components/ActionFooter.vue'
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
  // 同步 Pinia 数据
  filingStore.syncFilesToFormData()
  setValues(formData.value)

  // 验证
  const result = await validate()

  if (result.valid) {
    // === 验证成功 ===
    const success = await filingStore.triggerSubmit()
    if (success) {
      // 使用 replace 防止用户点“后退”又回到填表页重复提交
      router.replace('/')
    }
  } else {
    // === 验证失败 ===
    console.log('表单验证失败', result.errors)
    // 等待 Vue 更新 DOM (显示错误红字) 后再滚动
    await nextTick()
    // 这里的 result.errors 就是 Record<path, message>
    scrollToFirstError(result.errors)
  }
}

// === 处理重置 ===
const handleFormReset = () => {
  // 重置验证状态
  resetForm()
}

// 定义字段与 Section 类的映射关系
const fieldToSectionMap: Record<string, string> = {
  // === Basic Section ===
  leaderName: '.section-basic',
  leaderId: '.section-basic',
  department: '.section-basic',
  title: '.section-basic',
  phone: '.section-basic',
  email: '.section-basic',
  projectName: '.section-basic',
  projectSource: '.section-basic',
  projectType: '.section-basic',
  experimenterCount: '.section-basic',

  // === Personnel Section ===
  personnel: '.section-personnel', // 数组字段通常是 personnel[0].name

  // === Risk Section ===
  animalName: '.section-risk',
  animalStrain: '.section-risk',
  animalGrade: '.section-risk',
  pathogenName: '.section-risk',
  pathogenType: '.section-risk',
  pathogenSource: '.section-risk',
  bslLevel: '.section-risk',
  operationTypes: '.section-risk',
  isZoonotic: '.section-risk',
  isHighPathogenic: '.section-risk',
  hasToxicSubstance: '.section-risk',
  toxicSubstanceDesc: '.section-risk',

  // === Location Section ===
  locationType: '.section-location',
  locationDetail: '.section-location',
  dateRange: '.section-location',

  // === Content Section ===
  workProject: '.section-content',
  experimentMethod: '.section-content',
  experimentPurpose: '.section-content',
  disposalMethod: '.section-content',
  facilityMatchDesc: '.section-content',

  // === Files Section ===
  certifyExplanation: '.section-files',
  certifyImagesPath: '.section-files',
  publicInfoType: '.section-files',
  publicInfoDesc: '.section-files',
}

// 滚动到错误位置
const scrollToFirstError = (errors: Record<string, string | undefined>) => {
  const keys = Object.keys(errors)
  if (keys.length === 0) return
  // 获取第一个错误的字段名
  const firstErrorKey = keys[0]
  // 处理数组或嵌套对象的情况
  const rootKey = firstErrorKey?.split(/[.[]/)[0]
  if (!rootKey) return
  // 查找该字段属于哪个 Section
  const sectionSelector = fieldToSectionMap[rootKey]
  if (sectionSelector) {
    const sectionEl = document.querySelector(sectionSelector)
    if (sectionEl) {
      // 偏移量
      const headerOffset = 80
      const elementPosition = sectionEl.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
      return
    }
  }
  // 如果没有匹配到 Section，尝试滚回顶部
  console.warn('无法定位错误区域，滚动至顶部', firstErrorKey)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
