import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  MessagePlugin,
  type UploadFile,
  type UploadProps,
} from 'tdesign-vue-next'
import axios, { AxiosError } from 'axios'
import { cloneDeep } from 'lodash-es'
import { filingAPI } from '@/api/index'
import type { FilingRecord, FormDataState, ImageUploadResponse } from '@/types'

export const useFilingStore = defineStore('filing', () => {
  const submitting = ref(false)
  const exporting = ref(false)
  const files = ref<UploadFile[]>([])
  const records = ref<FilingRecord[]>([]) // 备案记录列表
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

  const formatResponse: UploadProps['formatResponse'] = (
    response: ImageUploadResponse,
  ) => {
    if (response.code === 0 && response.data) {
      return {
        status: 'success',
        url: response.data.url,
        dbPath: response.data.dbPath,
        originalName: response.data.originalName,
      }
    }
    return { status: 'fail', error: response.message || '上传失败' }
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
      const res = await filingAPI.submit(payload)
      MessagePlugin.success(res.data.message)
      console.log(res.data.data)
      // 提交成功后，重置表单并跳转回首页
      resetForm()
      files.value = []
      return true
    } catch (error) {
      console.error(error)
      MessagePlugin.error('提交失败')
      if (error instanceof AxiosError) {
        MessagePlugin.error(error.response?.data.message)
      }
      return false
    } finally {
      submitting.value = false
    }
  }

  // === 获取列表 ===
  const fetchRecords = async () => {
    loading.value = true
    const res = await filingAPI.getMyRecords()
    try {
      const responseData = res.data
      if (Array.isArray(responseData)) {
        records.value = responseData
      } else {
        records.value = []
      }
    } catch (error) {
      console.error(error)
      MessagePlugin.error(res.data.message)
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
      console.error(error)
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
      console.error(error)
    }
  }

  const exportAllRecords = async (currentYear: number) => {
    exporting.value = true
    try {
      const response = await filingAPI.exportAll()
      const filename = `生物安全备案汇总_${currentYear}.zip`
      downloadBlob(response.data, filename)
      MessagePlugin.success('批量导出成功')
    } catch (error) {
      MessagePlugin.error('导出失败，请检查权限')
      console.error(error)
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

  const handleDownloadError = (error: unknown) => {
    // 使用 axios.isAxiosError 缩小类型范围
    // 只要通过这个判断，TS 就会自动将 error 识别为 AxiosError 类型
    if (axios.isAxiosError(error)) {
      // 此时访问 error.response 是安全的（类型提示也会出来）
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const errData = JSON.parse(reader.result as string)
            MessagePlugin.error(errData.message || '生成失败')
          } catch (e) {
            MessagePlugin.error('服务器错误')
            console.error(e)
          }
        }
        reader.readAsText(error.response.data)
      } else {
        // 如果有 response 但不是 blob，或者根本没有 response
        MessagePlugin.error(error.message || '网络请求失败')
      }
    } else {
      // 处理非 Axios 错误（例如代码逻辑抛出的 Error）
      console.error('发生错误:', error)
      MessagePlugin.error('发生未知系统错误')
    }
  }

  const syncFilesToFormData = () => {
    const paths: string[] = []
    console.log('syncFilesToFormData', files.value)
    console.log('files', formData.certifyImagesPath)
    if (!files.value || files.value.length < 1) return
    files.value.forEach((file) => {
      if (file.status !== 'success' || !file.response) {
        return
      }

      const resp = file.response as {
        status: 'success'
        url: string
        dbPath: string
        originalName: string
      }

      const dbPath = resp.dbPath

      if (dbPath) {
        paths.push(dbPath)
      } else {
        console.warn('未找到 dbPath，文件对象:', file)
      }
    })
    formData.certifyImagesPath = paths

    console.log(
      '更新后的 formData.certifyImagesPath:',
      formData.certifyImagesPath,
    )
  }

  return {
    // 状态
    loading,
    submitting,
    exporting,
    // 方法
    resetForm,
    syncFilesToFormData,
    triggerSubmit,
    fetchRecords,
    deleteRecord,
    downloadRecordDoc,
    exportAllRecords,
    handleDownloadError,
    // 数据
    formData,
    records,
    files,
    formatResponse,
  }
})
