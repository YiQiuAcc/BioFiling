<template>
  <div id="section-content" class="form-section">
    <t-card title="设施与内容" :bordered="false" header-bordered>
      <t-row :gutter="[24, 24]">
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="主要工作项目"
            name="workProject"
            :status="errors.workProject ? 'error' : 'success'"
            :tips="errors.workProject"
          >
            <t-textarea
              v-model="formData.workProject"
              :autosize="{ minRows: 4 }"
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="实验方法"
            name="experimentMethod"
            :status="errors.experimentMethod ? 'error' : 'success'"
            :tips="errors.experimentMethod"
          >
            <t-textarea
              v-model="formData.experimentMethod"
              :autosize="{ minRows: 4 }"
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="实验目的"
            name="experimentPurpose"
            :status="errors.experimentPurpose ? 'error' : 'success'"
            :tips="errors.experimentPurpose"
          >
            <t-textarea
              v-model="formData.experimentPurpose"
              :autosize="{ minRows: 4 }"
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="设施匹配性描述"
            name="facilityMatchDesc"
            help="包括：个人防护、警告标识、体检、废物处理、菌种保存等"
            :status="errors.facilityMatchDesc ? 'error' : 'success'"
            :tips="errors.facilityMatchDesc"
          >
            <t-textarea
              v-model="formData.facilityMatchDesc"
              placeholder="现有实验设施条件..."
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="保存及污染物处理方法"
            name="disposalMethod"
            :status="errors.disposalMethod ? 'error' : 'success'"
            :tips="errors.disposalMethod"
          >
            <t-textarea
              v-model="formData.disposalMethod"
              placeholder="请详细描述..."
            />
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
</script>
