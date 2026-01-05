import { createRouter, createWebHistory } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAuthStore } from '@/stores/auth'
import FilingView from '@/views/FilingView.vue'
import MainLayout from '@/layouts/MainLayout.vue'

// 确保引入消息组件

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: FilingView,
        meta: { requiresAuth: true },
      },
    ],
  },
  // 建议添加一个不需要登录的 landing page 或错误页，防止死循环时的无处可去
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

// 全局路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 处理 CAS 回调 (URL 中带有 ticket)
  if (to.query.ticket) {
    const ticket = to.query.ticket as string

    // 执行验证
    const success = await authStore.handleTicketValidation(ticket)

    // 清理 URL 中的 ticket 参数
    const query = { ...to.query }
    delete query.ticket

    if (success) {
      // 验证成功：替换当前 URL (去掉 ticket)，继续流程
      next({ path: to.path, query, replace: true })
    } else {
      // 自动 login() 会导致：后端报401 -> 跳转CAS -> CAS发现Cookie有效 -> 跳转回前端 -> 带新ticket -> 后端报401... (死循环)
      MessagePlugin.error('登录验证失败，请尝试重新点击登录或联系管理员')
      // 可以选择跳转到一个公共页，或者去掉 ticket 参数留在当前页让用户手动重试
      next({ path: to.path, query, replace: true })
    }
    return
  }

  // 检查用户登录状态
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // 确实未登录，且去往需要权限的页面 -> 跳转 CAS
    authStore.login()
  } else {
    // 已有 Token 但内存中无用户信息 (页面刷新场景)
    if (authStore.isLoggedIn && !authStore.currentUser) {
      await authStore.initAuth()
    }
    next()
  }
})

export default router
