import axios from 'axios'
import type { FormDataState, User } from '@/types'

// 配置常量
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
// 确保这个地址没有多余的斜杠
const CAS_SERVER_URL =
  import.meta.env.VITE_CAS_SERVER_URL || 'https://cas.example.edu.cn/authserver'
const SERVICE_URL = window.location.origin

// 根据后端返回的实际结构定义接口
export interface LoginResponse {
  token: string
  user: User
}

// Axios 实例配置
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
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

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理 401 未授权
    if (error.response?.status === 401) {
      // 不直接跳转，交给业务逻辑处理，或者只清除状态
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
    }
    return Promise.reject(error)
  },
)

/**
 * 认证资源 (Auth Resource)
 */
export const authAPI = {
  // CAS 登录重定向
  redirectToCasLogin: () => {
    const targetUrl = `${CAS_SERVER_URL}/login?service=${encodeURIComponent(SERVICE_URL)}`
    window.location.href = targetUrl
  },

  // 验证 Ticket
  // POST - /auth/cas/validate
  validateTicket: (ticket: string) => {
    return apiClient.post<LoginResponse>('/auth/cas/validate', {
      ticket,
      service: SERVICE_URL, // 确保这个 Service URL 和 redirectToCasLogin 中的完全一致
    })
  },

  // 获取当前用户
  getCurrentUser: () => apiClient.get<User>('/auth/me'),

  // 登出
  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    window.location.href = `${CAS_SERVER_URL}/logout?service=${encodeURIComponent(SERVICE_URL)}`
  },
}

/**
 * 备案记录资源 (Filing Resource)
 */
export const filingAPI = {
  createAndDownload: (data: FormDataState) =>
    apiClient.post('/filings', data, { responseType: 'blob' }),

  list: (params?: { page?: number; per_page?: number }) =>
    apiClient.get('/filings', { params }),

  delete: (recordId: number) => apiClient.delete(`/filings/${recordId}`),

  exportArchive: () =>
    apiClient.get('/filings/archive', { responseType: 'blob' }),
}

export const statsAPI = {
  get: () => apiClient.get('/stats'),
}

export const systemAPI = {
  health: () => apiClient.get('/health'),
}

export const adminAPI = {
  exportAll: () => apiClient.get('/admin/export', { responseType: 'blob' }),
}

export default apiClient
