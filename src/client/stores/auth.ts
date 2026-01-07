import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { MessagePlugin } from 'tdesign-vue-next'
import { authAPI } from '@/api/index'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const currentUser = ref<User | void>()
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
      console.log(res.data.message)
      currentUser.value = res.data.data
    } catch (error) {
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
      const { data: loginResponse } = res.data

      if (!loginResponse) {
        throw new Error('Invalid login response')
      }
      MessagePlugin.info(res.data.message)
      // 保存状态
      token.value = loginResponse.token
      currentUser.value = loginResponse.user
      localStorage.setItem('auth_token', token.value)

      MessagePlugin.success(`欢迎回来，${currentUser.value.name}`)
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
    currentUser.value = void 0
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
