<template>
  <div id="section-risk" class="form-section">
    <t-card title="实验对象与风险" :bordered="false" header-bordered>
      <div class="sub-header">
        <logo-gitlab-icon style="margin-right: 8px" />
        实验动物
      </div>
      <t-row :gutter="[24, 24]">
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="动物名称"
            name="animalName"
            :status="errors.animalName ? 'error' : 'success'"
            :tips="errors.animalName"
          >
            <t-input
              v-model="formData.animalName"
              placeholder="如：小鼠 (选填)"
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="品种品系" name="animalStrain">
            <t-input
              v-model="formData.animalStrain"
              placeholder="如：C57BL/6"
            />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="动物等级" name="animalGrade">
            <t-select
              v-model="formData.animalGrade"
              :options="ANIMAL_GRADES"
              placeholder="请选择"
            />
          </t-form-item>
        </t-col>
      </t-row>

      <t-divider dashed style="margin: 32px 0"></t-divider>

      <div class="sub-header">
        <bug-icon style="margin-right: 8px" />
        病原微生物
      </div>
      <t-row :gutter="[24, 24]">
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item
            label="病原微生物名称"
            name="pathogenName"
            :status="errors.pathogenName ? 'error' : 'success'"
            :tips="errors.pathogenName"
          >
            <t-input v-model="formData.pathogenName" placeholder="标准名称" />
          </t-form-item>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="微生物种类" name="pathogenType">
            <t-radio-group
              v-model="formData.pathogenType"
              variant="default-filled"
            >
              <t-radio-button value="动物">动物</t-radio-button>
              <t-radio-button value="植物">植物</t-radio-button>
              <t-radio-button value="微生物">微生物</t-radio-button>
              <t-radio-button value="其他">其他</t-radio-button>
            </t-radio-group>
          </t-form-item>
        </t-col>

        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="来源 (Source)" name="pathogenSource">
            <t-input
              v-model="formData.pathogenSource"
              placeholder="如：ATCC, 临床分离株"
            />
          </t-form-item>
        </t-col>

        <t-col :span="24" :xs="24">
          <t-form-item
            label="生物安全等级 (BSL)"
            name="bslLevel"
            :status="errors.bslLevel ? 'error' : 'success'"
            :tips="errors.bslLevel"
          >
            <t-radio-group v-model="formData.bslLevel" class="bsl-group">
              <t-radio
                v-for="level in BSL_LEVELS"
                :key="level.value"
                :value="level.value"
                class="bsl-radio"
              >
                {{ level.label }}
              </t-radio>
            </t-radio-group>
          </t-form-item>
        </t-col>

        <t-col :span="24" :xs="24">
          <t-form-item
            label="操作类型"
            name="operationTypes"
            :status="errors.operationTypes ? 'error' : 'success'"
            :tips="errors.operationTypes"
          >
            <t-checkbox-group
              v-model="formData.operationTypes"
              :options="OPERATION_TYPES"
            />
          </t-form-item>
        </t-col>

        <t-col :span="12" :md="12" :xs="24">
          <div class="switch-card">
            <span>是否为人畜共患病</span>
            <t-switch v-model="formData.isZoonotic" />
          </div>
        </t-col>
        <t-col :span="12" :md="12" :xs="24">
          <div class="switch-card">
            <span>是否高致病性</span>
            <t-switch v-model="formData.isHighPathogenic" />
          </div>
        </t-col>

        <t-col :span="12" :md="12" :xs="24">
          <t-form-item label="是否使用有毒/害物质" name="hasToxicSubstance">
            <div class="expandable-section" style="width: 100%">
              <div class="switch-row">
                <t-switch
                  v-model="formData.hasToxicSubstance"
                  :label="['是', '否']"
                />
                <span class="tip-text" v-if="!formData.hasToxicSubstance">
                  如涉及, 请开启开关填写详细说明
                </span>
              </div>
              <transition name="slide-fade">
                <t-textarea
                  v-if="formData.hasToxicSubstance"
                  v-model="formData.toxicSubstanceDesc"
                  placeholder="请详细说明使用情况（感染、放射、化学毒等）"
                  class="mt-3"
                  :tips="errors.toxicSubstanceDesc"
                />
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
import { BugIcon, LogoGitlabIcon } from 'tdesign-icons-vue-next'
import { useFormErrors } from 'vee-validate'
import { useFilingStore } from '@/stores/filing'
import { ANIMAL_GRADES, BSL_LEVELS, OPERATION_TYPES } from '@/constants'

const store = useFilingStore()
const { formData } = storeToRefs(store)
const errors = useFormErrors()
</script>
