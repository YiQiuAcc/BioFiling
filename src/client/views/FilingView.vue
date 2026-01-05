<template>
  <div>
    <t-alert theme="warning" class="mt-4 mb-3">
      <template #icon><info-circle-icon /></template>
      申报说明：请在线填写并提交，审核通过后需打印系统生成的docx文件
      <b>一式两份</b>
      ，签字盖章后提交。
    </t-alert>

    <t-form
      ref="formRef"
      :data="formData"
      :rules="rules"
      label-align="top"
      class="main-form"
      scroll-to-first-error="smooth"
    >
      <section-basic />
      <section-personnel />
      <section-risk />
      <section-location />
      <section-content />
      <section-files />
    </t-form>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { type FormRule } from 'tdesign-vue-next'
import { InfoCircleIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'
// 引入拆分后的子组件
import SectionBasic from '@/components/filing/SectionBasic.vue'
import SectionContent from '@/components/filing/SectionContent.vue'
import SectionFiles from '@/components/filing/SectionFiles.vue'
import SectionLocation from '@/components/filing/SectionLocation.vue'
import SectionPersonnel from '@/components/filing/SectionPersonnel.vue'
import SectionRisk from '@/components/filing/SectionRisk.vue'

const filingStore = useFilingStore()
const { formData } = storeToRefs(filingStore)

// 校验规则
const rules = computed<Record<string, FormRule[]>>(() => ({
  leaderName: [{ required: true, message: '请输入负责人姓名' }],
  leaderId: [{ required: true, message: '必填' }],
  department: [{ required: true, message: '必填' }],
  phone: [{ required: true, message: '必填' }],
  projectName: [{ required: true, message: '请输入课题名称' }],
  toxicSubstanceDesc: formData.value.hasToxicSubstance
    ? [{ required: true, message: '请详细说明使用情况' }]
    : [],
  publicInfoDesc:
    formData.value.publicInfoType === '部分公开'
      ? [{ required: true, message: '请说明需要保密的内容' }]
      : [],
  locationDetail: [{ required: true, message: '请输入详细地点' }],
  dateRange: [{ required: true, message: '请选择实验时间段' }],
}))
</script>
