<template>
  <div id="section-basic" class="form-section">
    <t-card title="基本信息" :bordered="false" header-bordered>
      <template #actions>
        <t-tag variant="light" theme="primary">负责人 & 课题</t-tag>
      </template>
      <t-row :gutter="[24, 24]">
        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item label="课题负责人" name="leaderName">
            <t-input v-model="formData.leaderName" placeholder="姓名">
              <template #prefix-icon><user-icon /></template>
            </t-input>
          </t-form-item>
        </t-col>
        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item label="工号" name="leaderId">
            <t-input v-model="formData.leaderId" placeholder="请输入工号" />
          </t-form-item>
        </t-col>

        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="所属院系" name="department">
            <t-input v-model="formData.department" placeholder="请输入院系名称">
              <template #prefix-icon><building-icon /></template>
            </t-input>
          </t-form-item>
        </t-col>

        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item label="职称" name="title">
            <t-select
              v-model="formData.title"
              :options="TITLE_OPTIONS"
              filterable
              placeholder="请选择"
            />
          </t-form-item>
        </t-col>
        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item label="实验人数" name="experimenterCount">
            <t-input-number
              v-model="formData.experimenterCount"
              :min="1"
              theme="column"
              style="width: 100%"
            />
          </t-form-item>
        </t-col>

        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item label="联系电话" name="phone">
            <t-input v-model="formData.phone" placeholder="手机或办公电话" />
          </t-form-item>
        </t-col>
        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item label="电子邮箱" name="email">
            <t-input
              v-model="formData.email"
              placeholder="example@example.edu.cn"
            />
          </t-form-item>
        </t-col>

        <t-col :span="6" :md="6" :sm="12" :xs="24">
          <t-form-item label="课题名称及编号" name="projectName">
            <t-input
              v-model="formData.projectName"
              placeholder="请输入完整的课题名称及项目编号"
            />
          </t-form-item>
        </t-col>

        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="课题来源" name="projectSource">
            <t-input v-model="formData.projectSource" placeholder="如：" />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="课题类型" name="projectType">
            <t-select v-model="formData.projectType" :options="PROJECT_TYPES" />
          </t-form-item>
        </t-col>
      </t-row>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { UserIcon } from 'tdesign-icons-vue-next'
import { BuildingIcon } from 'tdesign-icons-vue-next'
import { useFilingStore } from '@/stores/filing'
import { PROJECT_TYPES, TITLE_OPTIONS } from '@/constants'

const store = useFilingStore()
const { formData } = storeToRefs(store)
</script>
