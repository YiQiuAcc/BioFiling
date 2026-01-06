import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  MessagePlugin,
  type UploadFile,
  type UploadProps,
} from 'tdesign-vue-next'
import { cloneDeep } from 'lodash-es'
import { filingAPI } from '@/api/index'
import router from '@/router/router'
import { type FormDataState, type ImageUploadResponse } from '@/types'

export const useFilingStore = defineStore('filing', () => {
  const submitting = ref(false)
  const exporting = ref(false)
  const files = ref<UploadFile[]>([])
  const records = ref<any[]>([]) // 备案记录列表
  const loading = ref(false)
  // === Actions ===
  // === 默认状态工厂函数 ===
  const getDefaultFormData = (): FormDataState => ({
    leaderName: '',
    leaderId: '',
    department: '',
    title: '',
    phone: '',
    email: '',
    projectName: '',
    projectSource: '',
    projectType: '科研',
    experimenterCount: 1,
    personnel: [
      {
        key: crypto.randomUUID(),
        department: '',
        name: '',
        id: '',
        phone: '',
        content: '',
      },
    ],
    animalName: '',
    animalStrain: '',
    animalGrade: '',
    pathogenName: '',
    pathogenType: '微生物',
    pathogenSource: '',
    bslLevel: '',
    operationTypes: [],
    isZoonotic: false,
    isHighPathogenic: false,
    hasToxicSubstance: false,
    toxicSubstanceDesc: '',
    locationType: '校内',
    locationDetail: '',
    dateRange: [],
    facilityMatchDesc: '',
    workProject: '',
    experimentMethod: '',
    experimentPurpose: '',
    disposalMethod: '',
    publicInfoType: '部分公开',
    publicInfoDesc: '',
    certifyExplanation: '',
    certifyImagesPath: [],
  })
  const formatResponse: UploadProps['formatResponse'] = (response: ImageUploadResponse) => {
    // response 是后端返回的完整 JSON 对象
    if (response.code === 0) {
      return {
        status: 'success',        // 组件内部状态
        url: response.data!.url,   // 用于组件内显示缩略图
        response: response.data,  // 将后端数据透传，方便后续提交表单时获取 dbPath
      }
    }
    return { status: 'fail', error: response.message }
  }
  /**
   * 重置表单
   */
  const resetForm = () => {
    const defaultState = getDefaultFormData()
    // 使用 Object.assign 保持响应式引用不变
    Object.assign(formData, defaultState)
    // 如果有深层嵌套对象，建议结合 cloneDeep:
    // Object.assign(formData, cloneDeep(getDefaultFormData()))
  }
  // 初始化数据
  const formData = reactive<FormDataState>(getDefaultFormData())
  // 提交逻辑
  const triggerSubmit = async () => {
    submitting.value = true
    try {
      const payload = cloneDeep(formData)
      await filingAPI.submit(payload)
      MessagePlugin.success('备案提交成功')

      // 提交成功后，重置表单并跳转回首页
      resetForm()
      files.value = []
      router.push('/')
      return true
    } catch (error: any) {
      MessagePlugin.error(error.response?.data?.message || '提交失败')
      return false
    } finally {
      submitting.value = false
    }
  }

  // === 获取列表 ===
  const fetchRecords = async () => {
    loading.value = true
    try {
      const res = await filingAPI.getMyRecords()
      // 将响应数据类型转换为 any 以处理可能的包装格式
      const responseData = res.data as any
      // 如果是直接数组格式则直接使用，否则尝试从 data 属性获取
      if (Array.isArray(responseData)) {
        records.value = responseData
      } else {
        records.value = []
      }
    } catch (error) {
      console.error(error)
      MessagePlugin.error('获取备案记录失败')
    } finally {
      loading.value = false
    }
  }

  // === 删除记录 ===
  const deleteRecord = async (id: number) => {
    try {
      await filingAPI.delete(id)
      MessagePlugin.success('删除成功')
      fetchRecords()
    } catch (error) {
      MessagePlugin.error('删除失败')
    }
  }

  // === 下载单个文件 ===
  const downloadRecordDoc = async (id: number, projectName: string) => {
    try {
      MessagePlugin.loading('正在生成文档...')
      const response = await filingAPI.downloadRecord(id)
      downloadBlob(response.data, `生物安全备案_${projectName}.docx`)
      MessagePlugin.success('下载成功')
    } catch (error) {
      MessagePlugin.error('下载失败')
    }
  }

  const exportAllRecords = async (currentYear: number) => {
    exporting.value = true
    try {
      const response = await filingAPI.exportAll()
      let filename = `生物安全备案汇总_${currentYear}.zip`
      downloadBlob(response.data, filename)
      MessagePlugin.success('批量导出成功')
    } catch (error) {
      MessagePlugin.error('导出失败，请检查权限')
    } finally {
      exporting.value = false
    }
  }

  // === Utils (Internal) ===
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadError = (error: any) => {
    if (error.response?.data instanceof Blob) {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const errData = JSON.parse(reader.result as string)
          MessagePlugin.error(errData.message || '生成失败')
        } catch (e) {
          MessagePlugin.error('服务器错误')
        }
      }
      reader.readAsText(error.response.data)
    } else {
      MessagePlugin.error('网络请求失败')
    }
  }
  const syncFilesToFormData = () => {
    // 清空旧数据，避免重复 push
    const paths: string[] = []

    if (files.value && files.value.length > 0) {
      files.value.forEach((file) => {
        // 注意：根据你的 upload.controller.ts，后端返回结构在 file.response.dbPath
        // 如果是 TDesign 的 formatResponse 包装过，可能层级要注意
        if (file.response?.dbPath) {
          paths.push(file.response.dbPath)
        }
      })
    }

    // 更新 formData
    formData.certifyImagesPath = paths
  }
  return {
    formData,
    submitting,
    exporting,
    records,
    loading,
    files,
    deleteRecord,
    syncFilesToFormData,
    formatResponse,
    resetForm,
    triggerSubmit,
    exportAllRecords,
    handleDownloadError,
    fetchRecords,
    downloadRecordDoc,
  }
})
