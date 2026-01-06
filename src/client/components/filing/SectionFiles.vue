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
              v-model="store.files"
              name="certifyImages"
              action="/api/upload/image"
              :format-response="store.formatResponse"
              :headers="uploadHeaders"
              theme="image"
              accept="image/*"
              tip="请上传图片，将直接插入到文档中"
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
import { storeToRefs } from 'pinia'
import { useFormErrors } from 'vee-validate'
import { useFilingStore } from '@/stores/filing'

const store = useFilingStore()
const { formData } = storeToRefs(store)
const errors = useFormErrors()

// 为上传请求添加认证头部
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
}
</script>
