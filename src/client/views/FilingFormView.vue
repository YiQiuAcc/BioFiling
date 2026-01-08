<template>
  <div class="filing-container">
    <t-alert :theme="alertTheme" class="mt-4 mb-3">
      <template #icon><info-circle-icon /></template>
      {{ alertMessage }}
    </t-alert>

    <t-loading
      :loading="filingStore.loading"
      text="正在加载数据..."
      fullscreen
    />

    <t-form
      label-align="top"
      class="main-form"
      scroll-to-first-error="smooth"
      :disabled="isPreviewMode"
    >
      <section-basic class="section-basic" />

      <section-personnel class="section-personnel" :readonly="isPreviewMode" />

      <section-risk class="section-risk" />
      <section-location class="section-location" />
      <section-content class="section-content" />

      <section-files class="section-files" :readonly="isPreviewMode" />
    </t-form>

    <Teleport to="body">
      <div v-if="isPreviewMode" class="bottom-action-bar">
        <div class="action-content" align="right">
          <t-button theme="default" size="large" @click="router.back()">
            返回列表
          </t-button>
          <t-button
            theme="primary"
            size="large"
            class="ml-2"
            @click="handleDownload"
          >
            <template #icon><download-icon /></template>
            下载文档
          </t-button>
        </div>
      </div>

      <action-footer
        v-else
        @submit="handleFormSubmit"
        @reset="handleFormReset"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { DownloadIcon, InfoCircleIcon } from 'tdesign-icons-vue-next'
import { useForm } from 'vee-validate'
import { scrollToFirstError } from '@/utils/filing'
import { useFilingStore } from '@/stores/filing'
import ActionFooter from '@/components/ActionFooter.vue'
import SectionBasic from '@/components/filing/SectionBasic.vue'
import SectionContent from '@/components/filing/SectionContent.vue'
import SectionFiles from '@/components/filing/SectionFiles.vue'
import SectionLocation from '@/components/filing/SectionLocation.vue'
import SectionPersonnel from '@/components/filing/SectionPersonnel.vue'
import SectionRisk from '@/components/filing/SectionRisk.vue'
import { formDataSchemaTyped } from '@/types/index'

// === 初始化表单验证上下文 ===
const {
  validate,
  setValues,
  resetForm: resetVeeForm,
  errors: _,
} = useForm({
  validationSchema: formDataSchemaTyped,
})

// === 初始化数据 ===
const route = useRoute()
const router = useRouter()
const filingStore = useFilingStore()
const { formData } = storeToRefs(filingStore)

// === 状态判断 ===
const isEditMode = computed(() => route.name === 'FilingEdit')
const isPreviewMode = computed(() => route.name === 'FilingPreview')

// === UI文案 ===
const alertTheme = computed(() => {
  if (isPreviewMode.value) return 'success'
  if (isEditMode.value) return 'info'
  return 'warning'
})

const alertMessage = computed(() => {
  if (isPreviewMode.value) return '当前为预览模式，内容不可修改。'
  if (isEditMode.value) return '当前为编辑模式。修改完成后请点击提交保存。'
  return '申报说明：请在线填写并提交，审核通过后需打印系统生成的docx文件一式两份，签字盖章后提交。'
})

// === 初始化 ===
onMounted(async () => {
  // 编辑或预览模式都需要加载数据
  if (isEditMode.value || isPreviewMode.value) {
    const id = Number(route.params.id)
    if (!id) return router.replace('/')

    await filingStore.fetchRecordDetail(id)
    // 预览模式也建议 setValues，虽然不验证，但可以保证内部状态一致
    setValues(filingStore.formData)
  } else {
    filingStore.resetForm()
  }
})

// === 预览模式下的下载操作 ===
const handleDownload = () => {
  if (filingStore.currentRecord) {
    filingStore.downloadRecordDoc(
      filingStore.currentRecord.id,
      filingStore.formData.projectName,
    )
  }
}

// === 处理提交 ===
const handleFormSubmit = async () => {
  // 再次确保 Pinia 数据同步到验证器
  setValues(formData.value)
  // 验证
  const result = await validate()
  if (result.valid) {
    // === 验证成功 ===
    let success = false
    // 更新 或 新建
    if (isEditMode.value) {
      const id = Number(route.params.id)
      success = await filingStore.updateRecord(id)
    } else {
      success = await filingStore.triggerSubmit()
    }
    if (success) {
      // 成功后跳转回列表页
      router.replace('/')
    }
  } else {
    // === 验证失败 ===
    console.log('表单验证失败', result.errors)
    await nextTick()
    scrollToFirstError(result.errors)
  }
}

// === 处理重置 ===
const handleFormReset = () => {
  if (isEditMode.value) {
    // 编辑模式下重置：重新从服务器拉取原始数据，或者恢复到刚进入页面时的状态
    const id = Number(route.params.id)
    filingStore.fetchRecordDetail(id).then(() => {
      setValues(filingStore.formData)
    })
  } else {
    // 新建模式下重置：清空所有
    filingStore.resetForm()
    resetVeeForm()
  }
}
</script>
