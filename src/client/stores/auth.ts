import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { MessagePlugin } from 'tdesign-vue-next'
import { authAPI } from '@/api/index'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const currentUser = ref<User | null>(null)
  const token = ref(localStorage.getItem('auth_token') || '')

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => currentUser.value?.isAdmin || false)

  // Actions
  /**
   * 初始化：如果有 token，尝试获取用户信息
   */
  const initAuth = async () => {
    if (!token.value) return
    try {
      const res = await authAPI.getCurrentUser()
      currentUser.value = res.data
    } catch (error: any) {
      // 如果获取用户信息失败（Token 过期），清理状态
      console.warn('Init auth failed:', error)
      clearLocalAuth()
    }
  }

  /**
   * 触发 CAS 登录 (浏览器跳转)
   */
  const login = () => {
    authAPI.redirectToCasLogin()
  }

  /**
   * 处理 CAS 回调：用 ticket 换取 token
   */
  const handleTicketValidation = async (ticket: string) => {
    try {
      const res = await authAPI.validateTicket(ticket)

      // 后端返回: { token: "...", user: { ... } }
      // Axios 将其包裹在 data 中: res.data = { token: "...", user: { ... } }
      const { token: newToken, user } = res.data

      if (!newToken || !user) {
        throw new Error('Invalid response structure')
      }

      // 保存状态
      token.value = newToken
      currentUser.value = user
      localStorage.setItem('auth_token', newToken)

      // 可选：在此处将用户信息也存入 localStorage 防止刷新闪烁，但主要依靠 Token
      // localStorage.setItem('user_info', JSON.stringify(user))

      MessagePlugin.success(`欢迎回来，${user.name}`)
      return true
    } catch (error) {
      console.error('Ticket validation failed:', error)
      // 清理可能残留的错误 Token
      clearLocalAuth()
      return false
    }
  }

  /**
   * 登出
   */
  const logout = () => {
    clearLocalAuth()
    authAPI.logout() // 跳转到 CAS 注销页面
  }

  /**
   * 仅清理本地状态 (内部使用)
   */
  const clearLocalAuth = () => {
    token.value = ''
    currentUser.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
  }

  return {
    currentUser,
    token,
    isLoggedIn,
    isAdmin,
    initAuth,
    login,
    handleTicketValidation,
    logout,
  }
})
