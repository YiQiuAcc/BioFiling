<template>
  <div id="section-files" class="form-section">
    <t-card title="补充文件" :bordered="false" header-bordered>
      <t-row :gutter="[24, 24]">
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="证明文件"
            name="certifyImagesPath"
            :status="errors.certifyImagesPath ? 'error' : 'success'"
            :tips="errors.certifyImagesPath"
          >
            <t-upload
              v-model="files"
              name="certifyImages"
              action="/api/upload/image"
              :format-response="formatUploadResponse"
              :onSuccess="handleUploadSuccess"
              :onRemove="handleUploadSuccess"
              :headers="uploadHeaders"
              theme="image"
              accept="image/*"
              :readonly="readonly"
              tip="请上传图片，将直接插入到文档中"
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="证明文件说明"
            name="certifyExplanation"
            :status="errors.certifyExplanation ? 'error' : 'success'"
            :tips="errors.certifyExplanation"
          >
            <t-textarea
              v-model="formData.certifyExplanation"
              placeholder="请简要说明上传的证明文件内容（如伦理审查批件、资格证书等）"
              :autosize="{ minRows: 2 }"
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="信息公开设置"
            name="publicInfoType"
            :status="errors.publicInfoType ? 'error' : 'success'"
            :tips="errors.publicInfoType"
          >
            <div class="bg-settings">
              <t-radio-group v-model="formData.publicInfoType" class="mb-3">
                <t-radio value="公开">全部公开</t-radio>
                <t-radio value="部分公开">部分公开</t-radio>
                <t-radio value="保密">全部保密</t-radio>
              </t-radio-group>

              <transition name="slide-fade">
                <div
                  v-if="formData.publicInfoType === '部分公开'"
                  style="width: 100%"
                >
                  <t-textarea
                    v-model="formData.publicInfoDesc"
                    placeholder="请说明保密内容"
                    class="mt-2"
                    :status="errors.publicInfoDesc ? 'error' : 'default'"
                    :tips="errors.publicInfoDesc"
                  />
                </div>
              </transition>
            </div>
          </t-form-item>
        </t-col>
      </t-row>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { UploadFile } from 'tdesign-vue-next'
import { useFormErrors } from 'vee-validate'
import { formatUploadResponse } from '@/utils/filing'
import { useAuthStore } from '@/stores/auth'
import { useFilingStore } from '@/stores/filing'

const store = useFilingStore()
const { formData } = storeToRefs(store)
const authStore = useAuthStore()
const errors = useFormErrors()

// === 在组件内管理 files 状态 ===
const files = ref<UploadFile[]>([])

const props = defineProps<{
  readonly?: boolean
}>()

// === 同步逻辑 ===
const handleUploadSuccess = () => {
  const paths: string[] = []
  files.value.forEach((file) => {
    // 处理新上传的文件
    if (file.response && file.status === 'success') {
      const resp = file.response as any
      if (resp.dbPath) paths.push(resp.dbPath)
    }
    // 处理已存在的文件 (如果是编辑回显的情况)
    else if (file.url) {
      paths.push(file.url) // 或者你需要解析出相对路径
    }
  })
  // 更新 Store 中的 formData
  formData.value.certifyImagesPath = paths
}
onMounted(() => {
  // 监听 formData.certifyImagesPath 的变化，将图片 URL 转换为 UploadFile 对象
  watch(
    () => formData.value.certifyImagesPath,
    (paths) => {
      if (paths && paths.length > 0 && files.value.length === 0) {
        files.value = paths.map((p) => ({
          name: '已上传图片',
          url: p,
          status: 'success',
        }))
      }
      if (formData.value.certifyImagesPath.length === 0) {
        files.value = []
      }
    },
    { immediate: true },
  )
})
const uploadHeaders = {
  Authorization: `Bearer ${authStore.token}`,
}
</script>
