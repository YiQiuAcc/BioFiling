import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { MessagePlugin } from 'tdesign-vue-next'
import { authAPI } from '@/api/index'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const currentUser = ref<User | undefined>()
  const token = ref(localStorage.getItem('auth_token') || '')

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => currentUser.value?.isAdmin || false)

  // 内部清理方法
  const clearLocalAuth = () => {
    token.value = ''
    currentUser.value = undefined
    localStorage.removeItem('auth_token')
    // localStorage.removeItem('user_info')
  }

  /**
   * 初始化：如果有 token, 尝试获取用户信息
   */
  const initAuth = async () => {
    if (!token.value) return
    try {
      const res = await authAPI.getCurrentUser()
      if (res.data && res.data.data) {
        currentUser.value = res.data.data
      }
    } catch (error) {
      console.warn('Init auth failed (Token expired):', error)
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

      const apiResponse = res.data

      if (!apiResponse || !apiResponse.data) {
        throw new Error('Invalid login response')
      }

      const { token: newToken, user } = apiResponse.data

      MessagePlugin.success(apiResponse.message || '登录成功')

      // 保存状态
      token.value = newToken
      currentUser.value = user
      localStorage.setItem('auth_token', newToken)
      // 可存用户信息在 localStorage
      // localStorage.setItem('user_info', JSON.stringify(user))

      MessagePlugin.success(`欢迎回来, ${user.name}`)
      return true
    } catch (error) {
      console.error('Ticket validation failed:', error)
      MessagePlugin.error('登录验证失败, 请重试')
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
