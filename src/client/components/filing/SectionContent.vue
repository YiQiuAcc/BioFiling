<template>
  <div id="section-content" class="form-section">
    <t-card title="设施与内容" :bordered="false" header-bordered>
      <t-row :gutter="[24, 24]">
        <t-col :span="24" :md="12" :xs="24">
          <t-form-item label="主要工作项目" name="workProject">
            <t-textarea
              v-model="formData.workProject"
              :autosize="{ minRows: 3 }"
              placeholder="请填写..."
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="实验方法" name="experimentMethod">
            <t-textarea
              v-model="formData.experimentMethod"
              :autosize="{ minRows: 4 }"
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="实验目的" name="experimentPurpose">
            <t-textarea
              v-model="formData.experimentPurpose"
              :autosize="{ minRows: 4 }"
            />
          </t-form-item>
        </t-col>
        <t-col :span="24" :md="12" :xs="24">
          <t-form-item
            label="设施匹配性描述"
            name="facilityMatchDesc"
            help="包括：个人防护、警告标识、体检、废物处理、菌种保存等"
          >
            <t-textarea
              v-model="formData.facilityMatchDesc"
              placeholder="现有实验设施条件..."
            />
          </t-form-item>
        </t-col>
        <t-col :span="24" :md="12" :xs="24">
          <t-form-item label="保存及污染物处理方法" name="disposalMethod">
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
import { useFilingStore } from '@/stores/filing'

const store = useFilingStore()
const { formData } = storeToRefs(store)
</script>
