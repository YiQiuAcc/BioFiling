import axios, { type AxiosResponse } from 'axios'
import { type ApiResponse, type FilingRecord, type FormDataState, type LoginResponse, type User } from '@/types'
import type { ZodIssue } from 'zod'

// === 配置常量 ===
const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const CAS_SERVER_URL =
  import.meta.env.VITE_CAS_SERVER_URL || 'https://cas.example.edu.cn/authserver'
const SERVICE_URL = window.location.origin

// === Axios 实例 ===
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// === 请求拦截器 ===
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// === 响应拦截器 ===
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
      // 可触发全局事件让UI跳转
    }
    return Promise.reject(error)
  },
)

// === 通用下载处理 ===
// 用于处理后端返回的 Blob 流（Word 或 Zip）
export const downloadBlob = (response: AxiosResponse<Blob>, originFilename: string) => {
  const { data, headers } = response

  // 尝试从 Content-Disposition 获取文件名
  let filename = originFilename
  const disposition = headers['content-disposition']
  if (disposition) {
    // 匹配 filename="xxx" 或 filename*=utf-8''xxx
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    const matches = filenameRegex.exec(disposition)
    if (matches != null && matches[1]) {
      filename = decodeURIComponent(
        matches[1].replace(/['"]/g, '').replace("utf-8''", ''),
      )
    }
  }

  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// === 认证 API ===
export const authAPI = {
  redirectToCasLogin: () => {
    const targetUrl = `${CAS_SERVER_URL}/login?service=${encodeURIComponent(SERVICE_URL)}`
    window.location.href = targetUrl
  },

  // POST /api/auth/cas/validate
  validateTicket: (ticket: string) => {
    return apiClient.post<ApiResponse< LoginResponse|void>>('/auth/cas/validate', {
      ticket,
      service: SERVICE_URL,
    })
  },

  // GET /api/auth/me
  getCurrentUser: () => apiClient.get<ApiResponse<User|void>>('/auth/me'),

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    window.location.href = `${CAS_SERVER_URL}/logout?service=${encodeURIComponent(SERVICE_URL)}`
  },
}

// === 备案记录 API ===
export const filingAPI = {
  /**
   * 提交表单
   * POST /api/filings/submit
   */
  submit: (data: FormDataState) => {'blob'
    return apiClient.post<ApiResponse<number|ZodIssue[]|string>>('/filings/submit', data)
  },

  /**
   * 获取我的提交记录
   * GET /api/filings/my
   */
  getMyRecords: () => apiClient.get<ApiResponse<FilingRecord[]|void>>('/filings/my'),

  /**
   * 删除记录
   * DELETE /api/filings/:id
   */
  delete: (recordId: number) => apiClient.delete<ApiResponse>(`/filings/${recordId}`),

  /**
   * 导出所有记录 (管理员)
   * GET /api/filings/exports
   * 返回 ZIP 流
   */
  exportAll: () =>
    apiClient.get('/filings/exports', {
      responseType: 'blob',
    }),
  /**
   * 下载单个备案生成的文档
   * GET /api/filings/:id/download
   */
  downloadRecord: (id: number) =>
    apiClient.get(`/filings/${id}/download`, {
      responseType: 'blob',
    }),
}

export default apiClient
