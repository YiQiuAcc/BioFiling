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
      <action-footer
        :isPreviewMode="isPreviewMode"
        @submit="handleFormSubmit"
        @reset="handleFormReset"
        @audit="openAuditDialog"
      />
    </Teleport>

    <!-- 审核对话框 -->
    <t-dialog
      v-model:visible="showAuditDialog"
      :header="auditStatus === 'APPROVED' ? '审核通过' : '审核驳回'"
      :confirm-btn="{
        content: '提交结论',
        theme: auditStatus === 'APPROVED' ? 'primary' : 'danger',
        loading: auditLoading,
      }"
      @confirm="submitAudit"
    >
      <t-form label-align="top">
        <t-form-item label="审核意见" name="comment">
          <t-textarea
            v-model="auditComment"
            :placeholder="
              auditStatus === 'APPROVED'
                ? '请输入审核意见（可选）'
                : '请输入驳回原因（必填）'
            "
            :status="auditError ? 'error' : 'default'"
            :tips="auditError"
            autosize
            :maxlength="100"
            indicator
            @focus="auditError = ''"
          />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { MessagePlugin } from 'tdesign-vue-next'
import { InfoCircleIcon } from 'tdesign-icons-vue-next'
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

// === 审核相关状态 ===
const showAuditDialog = ref(false)
const auditStatus = ref<'APPROVED' | 'REJECTED'>('APPROVED')
const auditComment = ref('')
const auditLoading = ref(false)
const auditError = ref('')

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
  if (isPreviewMode.value) return '当前为预览模式, 内容不可修改。'
  if (isEditMode.value) return '当前为编辑模式。修改完成后请点击提交保存。'
  return '申报说明：请在线填写并提交, 审核通过后需打印系统生成的docx文件一式两份, 签字盖章后提交。'
})

// === 打开审核对话框 ===
const openAuditDialog = (status: 'APPROVED' | 'REJECTED') => {
  auditStatus.value = status
  auditComment.value = ''
  auditError.value = ''
  showAuditDialog.value = true
}

// === 提交审核 ===
const submitAudit = async () => {
  // 验证评论字段
  if (auditStatus.value === 'REJECTED' && !auditComment.value.trim()) {
    auditError.value = '驳回原因不能为空'
    return
  }
  if (auditComment.value.length > 100) {
    auditError.value = '审核意见不能超过100个字符'
    return
  }
  auditLoading.value = true
  try {
    if (!filingStore.currentRecord?.id) {
      throw new Error('当前记录缺少ID')
    }
    await filingStore.auditRecord(
      filingStore.currentRecord?.id,
      auditStatus.value,
      auditComment.value,
    )
    MessagePlugin.success(
      auditStatus.value === 'APPROVED' ? '审核通过成功' : '审核驳回成功',
    )
    showAuditDialog.value = false
    // 审核完成后返回列表
    router.push('/')
  } catch (error) {
    console.error('审核失败:', error)
    MessagePlugin.error('审核失败, 请稍后重试')
  } finally {
    auditLoading.value = false
  }
}

// === 初始化 ===
onMounted(async () => {
  if (isEditMode.value || isPreviewMode.value) {
    const id = Number(route.params.id)
    if (!id) return router.replace('/')
    await filingStore.fetchRecordDetail(id)
    setValues(filingStore.formData)
  } else {
    filingStore.resetForm()
  }
})

// === 处理提交 ===
const handleFormSubmit = async () => {
  // Pinia 数据同步到验证器
  setValues(formData.value)
  // 验证
  const result = await validate()
  if (result.valid) {
    let success = false
    // 更新/新建
    if (isEditMode.value) {
      const id = Number(route.params.id)
      success = await filingStore.updateRecord(id)
    } else {
      success = await filingStore.triggerSubmit()
    }
    if (success) {
      MessagePlugin.success('提交成功')
      // 成功后跳转回列表页
      router.replace('/')
    }
  } else {
    console.log('表单验证失败', result.errors)
    await nextTick()
    scrollToFirstError(result.errors)
  }
}

// === 处理重置 ===
const handleFormReset = () => {
  if (isEditMode.value) {
    // 编辑模式下, 重新从服务器拉取原始数据
    const id = Number(route.params.id)
    filingStore.fetchRecordDetail(id).then(() => {
      setValues(filingStore.formData)
    })
  } else {
    // 新建模式下, 清空所有
    filingStore.resetForm()
    resetVeeForm()
  }
  MessagePlugin.success('表单已重置')
}
</script>
