<template>
  <div id="section-basic" class="form-section">
    <t-card title="基本信息" :bordered="false" header-bordered>
      <template #actions>
        <t-tag variant="light" theme="primary">负责人 & 课题</t-tag>
      </template>
      <t-row :gutter="[24, 24]">
        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item
            label="课题负责人"
            name="leaderName"
            :status="errors.leaderName ? 'error' : 'success'"
            :tips="errors.leaderName"
          >
            <t-input v-model="formData.leaderName" placeholder="姓名">
              <template #prefix-icon><user-icon /></template>
            </t-input>
          </t-form-item>
        </t-col>

        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item
            label="工号"
            name="leaderId"
            :status="errors.leaderId ? 'error' : 'success'"
            :tips="errors.leaderId"
          >
            <t-input v-model="formData.leaderId" placeholder="请输入工号" />
          </t-form-item>
        </t-col>

        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="所属院系"
            name="department"
            :status="errors.department ? 'error' : 'success'"
            :tips="errors.department"
          >
            <t-input v-model="formData.department" placeholder="请输入院系名称">
              <template #prefix-icon><building-icon /></template>
            </t-input>
          </t-form-item>
        </t-col>

        <t-col :span="6" :md="6" :xs="24">
          <t-form-item
            label="职称"
            name="title"
            :status="errors.title ? 'error' : 'success'"
            :tips="errors.title"
          >
            <t-input v-model="formData.title" />
          </t-form-item>
        </t-col>
        <t-col :span="6" :md="6" :xs="24">
          <t-form-item
            label="手机号"
            name="phone"
            :status="errors.phone ? 'error' : 'success'"
            :tips="errors.phone"
          >
            <t-input v-model="formData.phone" />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="邮箱"
            name="email"
            :status="errors.email ? 'error' : 'success'"
            :tips="errors.email"
          >
            <t-input v-model="formData.email" />
          </t-form-item>
        </t-col>
        <t-divider />
        <div class="sub-header">项目内容</div>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="项目名称"
            name="projectName"
            :status="errors.projectName ? 'error' : 'success'"
            :tips="errors.projectName"
          >
            <t-input v-model="formData.projectName" />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="项目编号"
            name="projectCode"
            :status="errors.projectCode ? 'error' : 'success'"
            :tips="errors.projectCode"
          >
            <t-input
              v-model="formData.projectCode"
              placeholder="请输入项目编号"
            />
          </t-form-item>
        </t-col>

        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="项目来源"
            name="projectSource"
            :status="errors.projectSource ? 'error' : 'success'"
            :tips="errors.projectSource"
          >
            <t-input v-model="formData.projectSource" />
          </t-form-item>
        </t-col>
        <t-col :span="6" :md="6" :xs="24">
          <t-form-item
            label="项目类别"
            name="projectType"
            :status="errors.projectType ? 'error' : 'success'"
            :tips="errors.projectType"
          >
            <t-select v-model="formData.projectType" :options="PROJECT_TYPES" />
          </t-form-item>
        </t-col>
        <t-col :span="6" :md="6" :xs="24">
          <t-form-item
            label="实验人数"
            name="experimenterCount"
            :status="errors.experimenterCount ? 'error' : 'success'"
            :tips="errors.experimenterCount"
          >
            <t-input-number
              v-model="formData.experimenterCount"
              :min="1"
              theme="column"
              style="width: 100%"
              placeholder="请输入人数"
            />
          </t-form-item>
        </t-col>
      </t-row>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { BuildingIcon, UserIcon } from 'tdesign-icons-vue-next'
import { useFormErrors } from 'vee-validate'
import { useFilingStore } from '@/stores/filing'
import { PROJECT_TYPES } from '@/constants'

const store = useFilingStore()
const { formData } = storeToRefs(store)
const errors = useFormErrors()
</script>
