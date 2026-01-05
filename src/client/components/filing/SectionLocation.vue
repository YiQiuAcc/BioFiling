<template>
  <div id="section-location" class="form-section">
    <t-card title="地点与时间" :bordered="false" header-bordered>
      <t-row :gutter="[24, 24]">
        <t-col :span="14" :md="14" :xs="24">
          <t-form-item label="实验地点" name="locationDetail">
            <t-input-group style="width: 100%">
              <t-select
                v-model="formData.locationType"
                :style="{ width: '100px', flexShrink: 0 }"
              >
                <t-option label="校内" value="校内" />
                <t-option label="校外" value="校外" />
              </t-select>
              <t-input
                v-model="formData.locationDetail"
                :placeholder="
                  formData.locationType === '校内'
                    ? '学院/楼栋/门牌'
                    : '合作单位名称及地址'
                "
              />
            </t-input-group>
          </t-form-item>
        </t-col>
        <t-col :span="10" :md="10" :xs="24">
          <t-form-item label="拟开展时间" name="dateRange">
            <t-date-range-picker
              v-model="formData.dateRange"
              allow-input
              clearable
              style="width: 100%"
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
