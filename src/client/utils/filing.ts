import { MessagePlugin, type UploadProps } from 'tdesign-vue-next'
import axios from 'axios'
import type { FormDataState, ImageUploadResponse } from '@/types'

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(1, 5)
}

// === 常量/工厂函数 ===
export const getDefaultFormData = (): FormDataState => ({
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
      key: generateId(),
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
  bslLevel: 'BSL-2',
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
  projectCode: '',
})

// === TDesign 上传组件格式化工具 ===
export const formatUploadResponse: UploadProps['formatResponse'] = (
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

// === 下载流处理工具 ===
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// === 错误处理工具 ===
export const handleDownloadError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
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
      MessagePlugin.error(error.message || '网络请求失败')
    }
  } else {
    console.error('发生错误:', error)
    MessagePlugin.error('发生未知系统错误')
  }
}

// === 出错滚动 ===
// 定义字段与 Section 类的映射关系
export const fieldToSectionMap: Record<string, string> = {
  leaderName: '.section-basic',
  leaderId: '.section-basic',
  department: '.section-basic',
  title: '.section-basic',
  phone: '.section-basic',
  email: '.section-basic',
  projectName: '.section-basic',
  projectSource: '.section-basic',
  projectType: '.section-basic',
  experimenterCount: '.section-basic',
  personnel: '.section-personnel',
  animalName: '.section-risk',
  animalStrain: '.section-risk',
  animalGrade: '.section-risk',
  pathogenName: '.section-risk',
  pathogenType: '.section-risk',
  pathogenSource: '.section-risk',
  bslLevel: '.section-risk',
  operationTypes: '.section-risk',
  isZoonotic: '.section-risk',
  isHighPathogenic: '.section-risk',
  hasToxicSubstance: '.section-risk',
  toxicSubstanceDesc: '.section-risk',
  locationType: '.section-location',
  locationDetail: '.section-location',
  dateRange: '.section-location',
  workProject: '.section-content',
  experimentMethod: '.section-content',
  experimentPurpose: '.section-content',
  disposalMethod: '.section-content',
  facilityMatchDesc: '.section-content',
  certifyExplanation: '.section-files',
  certifyImagesPath: '.section-files',
  publicInfoType: '.section-files',
  publicInfoDesc: '.section-files',
}

// 滚动到错误位置
export const scrollToFirstError = (
  errors: Record<string, string | undefined>,
) => {
  const keys = Object.keys(errors)
  if (keys.length === 0) return
  const firstErrorKey = keys[0]
  const rootKey = firstErrorKey?.split(/[.[]/)[0]
  if (!rootKey) return
  const sectionSelector = fieldToSectionMap[rootKey]
  if (sectionSelector) {
    const sectionEl = document.querySelector(sectionSelector)
    if (sectionEl) {
      const headerOffset = 80
      const elementPosition = sectionEl.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
      return
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
