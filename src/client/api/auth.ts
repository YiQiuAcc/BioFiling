import http from '@/api/http'
import type { ApiResponse, LoginResponse, User } from '@/types'

const CAS_SERVER_URL =
  import.meta.env.VITE_CAS_SERVER_URL || 'https://cas.example.edu.cn/authserver'
const SERVICE_URL = window.location.origin

export const authAPI = {
  /**
   * 跳转到 CAS 登录页
   */
  redirectToCasLogin: () => {
    const targetUrl = `${CAS_SERVER_URL}/login?service=${encodeURIComponent(SERVICE_URL)}`
    window.location.href = targetUrl
  },

  /**
   * 验证 Ticket
   * POST /api/auth/cas/validate
   */
  validateTicket: (ticket: string) => {
    return http.post<ApiResponse<LoginResponse>>('/auth/cas/validate', {
      ticket,
      service: SERVICE_URL,
    })
  },

  /**
   * 获取当前用户信息
   * GET /api/auth/me
   */
  getCurrentUser: () => http.get<ApiResponse<User>>('/auth/me'),

  /**
   * 登出
   */
  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    window.location.href = `${CAS_SERVER_URL}/logout?service=${encodeURIComponent(SERVICE_URL)}`
  },
}
