import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { MessagePlugin } from 'tdesign-vue-next'
import { AxiosError } from 'axios'
import { cloneDeep } from 'lodash-es'
import {
  downloadBlob,
  getDefaultFormData,
  handleDownloadError,
} from '@/utils/filing'
import { filingAPI } from '@/api/index'
import type { FilingDetail, FilingRecord, FormDataState } from '@/types'

export const useFilingStore = defineStore('filing', () => {
  // === State ===
  const loading = ref(false)
  const submitting = ref(false)
  const exporting = ref(false)

  // 核心业务数据
  const records = ref<FilingRecord[]>([])
  // 详情数据
  const currentRecord = ref<FilingRecord | null>(null)
  const formData = reactive<FormDataState>(getDefaultFormData())
  // === Actions: 表单操作 ===

  /** 重置表单 */
  const resetForm = () => {
    Object.assign(formData, getDefaultFormData())
  }

  /** 设置表单数据 (用于编辑回显) */
  const setFormData = (data: Partial<FormDataState>) => {
    // 深度合并或直接赋值，需注意数组的处理
    Object.assign(formData, data)
  }

  /** 提交新建 */
  const triggerSubmit = async () => {
    submitting.value = true
    try {
      const payload = cloneDeep(formData)
      const res = await filingAPI.submit(payload)
      MessagePlugin.success(res.data.message)
      resetForm()
      return true
    } catch (error) {
      handleApiError(error, '提交失败')
      return false
    } finally {
      submitting.value = false
    }
  }

  /** 提交更新 */
  const updateRecord = async (id: number) => {
    submitting.value = true
    try {
      const payload = cloneDeep(formData)
      const res = await filingAPI.update(id, payload)
      MessagePlugin.success(res.data.message)
      resetForm()
      return true
    } catch (error) {
      handleApiError(error, '更新失败')
      return false
    } finally {
      submitting.value = false
    }
  }

  /** 填充模拟数据 */
  const fillWithMockData = () => {
    const mockData: FormDataState = {
      leaderName: '张三',
      leaderId: 'U20201234',
      department: '计算机科学与技术学院',
      title: '教授',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      projectName: '基于人工智能的生物信息学研究项目',
      projectSource: '国家自然科学基金',
      projectType: '教学',
      experimenterCount: 5,
      personnel: [
        {
          key: '1',
          name: '李四',
          id: 'U20201235',
          department: '计算机科学与技术学院',
          phone: '13800138001',
          content: '负责算法设计',
        },
        {
          key: '2',
          name: '王五',
          id: 'U20201236',
          department: '生命科学学院',
          phone: '13800138002',
          content: '负责实验操作',
        },
        {
          key: '3',
          name: '赵六',
          id: 'U20201237',
          department: '医学部',
          phone: '13800138003',
          content: '负责数据分析',
        },
      ],
      animalName: '小鼠',
      animalStrain: 'C57BL/6J',
      animalGrade: 'SPF级',
      pathogenName: '大肠杆菌',
      pathogenType: '微生物',
      pathogenSource: 'ATCC',
      bslLevel: 'BSL-2',
      operationTypes: ['1.病毒培养', '5.未经培养的感染性材料'],
      isZoonotic: false,
      isHighPathogenic: false,
      hasToxicSubstance: true,
      toxicSubstanceDesc: '使用少量甲醛作为固定剂',
      locationType: '校内',
      locationDetail: '实验大楼A座301室',
      dateRange: ['2026-01-15', '2026-06-30'],
      facilityMatchDesc: '实验室设备齐全，符合生物安全要求',
      workProject: '每周工作5天，每天8小时',
      experimentMethod: '按照标准分子生物学实验方法进行',
      experimentPurpose: '研究蛋白质功能及其相互作用',
      disposalMethod: '按学校生物废物处理规定执行',
      certifyExplanation: '项目已通过伦理审查，符合安全规范',
      certifyImagesPath: [],
      publicInfoType: '部分公开',
      publicInfoDesc: '涉及部分商业机密，不对外公开',
      projectCode: '123',
    }

    // 重置表单后再填充模拟数据
    resetForm()
    Object.assign(formData, mockData)
  }

  // === Actions: 数据获取 ===
  const fetchRecords = async () => {
    loading.value = true
    try {
      const res = await filingAPI.getMyRecords()
      records.value = res.data.data || []
    } catch (error) {
      console.error(error)
      MessagePlugin.error('获取列表失败')
    } finally {
      loading.value = false
    }
  }

  const fetchRecordDetail = async (id: number) => {
    loading.value = true
    try {
      // 这里调用的是返回 FilingDetail 的接口
      const { data } = await filingAPI.getDetail(id)
      if (data && data.data) {
        const detail = data.data
        // 设置头部元数据 (currentRecord 只存基本信息即可)
        currentRecord.value = {
          id: detail.id,
          projectName: detail.projectName,
          status: detail.status,
          leaderName: detail.leaderName,
          department: detail.department,
          createdAt: detail.createdAt,
          auditComment: detail.auditComment,
        } as FilingRecord
        // 回填表单
        mapRecordToForm(detail)
      } else {
        MessagePlugin.error('记录不存在')
      }
    } catch (error) {
      console.error(error)
      MessagePlugin.error('获取详情失败')
    } finally {
      loading.value = false
    }
  }

  // === Actions: 业务操作 ===
  const deleteRecord = async (id: number) => {
    try {
      await filingAPI.delete(id)
      MessagePlugin.success('删除成功')
      // 如果删除的是当前列表中的项，直接本地移除，避免重新请求
      const idx = records.value.findIndex((r) => r.id === id)
      if (idx !== -1) records.value.splice(idx, 1)
    } catch (error) {
      MessagePlugin.error('删除失败')
    }
  }

  const auditRecord = async (
    id: number,
    status: 'APPROVED' | 'REJECTED',
    comment?: string,
  ) => {
    try {
      await filingAPI.audit(id, status, comment)

      // 更新本地状态
      if (currentRecord.value?.id === id) {
        currentRecord.value.status = status
        currentRecord.value.auditComment = comment || ''
      }
      const record = records.value.find((r) => r.id === id)
      if (record) record.status = status

      MessagePlugin.success(status === 'APPROVED' ? '已通过' : '已驳回')
      return true
    } catch (error) {
      MessagePlugin.error('审核操作失败')
      return false
    }
  }

  const downloadRecordDoc = async (id: number, projectName: string) => {
    try {
      MessagePlugin.loading('正在生成文档...')
      const response = await filingAPI.downloadRecord(id)
      downloadBlob(response.data, `生物安全备案_${projectName}.docx`)
      MessagePlugin.success('下载成功')
    } catch (error) {
      handleDownloadError(error)
    }
  }

  const exportAllRecords = async (currentYear: number) => {
    exporting.value = true
    try {
      const response = await filingAPI.exportAll()
      downloadBlob(response.data, `生物安全备案汇总_${currentYear}.zip`)
      MessagePlugin.success('导出成功')
    } catch (error) {
      MessagePlugin.error('导出失败')
    } finally {
      exporting.value = false
    }
  }

  // 内部通用错误处理
  const handleApiError = (error: unknown, defaultMsg: string) => {
    console.error(error)
    if (error instanceof AxiosError) {
      MessagePlugin.error(error.response?.data.message || defaultMsg)
    } else {
      MessagePlugin.error(defaultMsg)
    }
  }
  // === 将 API 返回的 Record 转换为 Form 需要的格式 ===
  // === 辅助函数：输入改为 FilingDetail ===
  const mapRecordToForm = (detail: FilingDetail) => {
    // 解构出不需要放入表单的系统字段
    const {
      id,
      status,
      createdAt,
      updatedAt,
      auditComment,
      submitterName,
      ...formFields
    } = detail
    // 准备回填数据
    // 强制转换为 any 或 FormDataState 以便进行清洗
    const targetData = { ...formFields } as FormDataState
    // 数据清洗 (后端 null -> 前端默认值)
    if (!targetData.leaderName) targetData.leaderName = ''
    if (!targetData.department) targetData.department = ''
    if (!targetData.certifyImagesPath) targetData.certifyImagesPath = []
    if (!targetData.personnel) targetData.personnel = []

    // 回填到响应式对象
    Object.assign(formData, targetData)
  }

  return {
    loading,
    submitting,
    exporting,
    records,
    currentRecord,
    formData,
    resetForm,
    setFormData,
    triggerSubmit,
    updateRecord,
    fetchRecords,
    fetchRecordDetail,
    deleteRecord,
    auditRecord,
    downloadRecordDoc,
    exportAllRecords,
    fillWithMockData,
  }
})
