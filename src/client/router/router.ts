import { createRouter, createWebHistory } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAuthStore } from '@/stores/auth'
import FilingFormView from '@/views/FilingFormView.vue'
import HomeView from '@/views/HomeView.vue'
import MainLayout from '@/layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: HomeView,
        meta: { requiresAuth: true },
      },
      {
        path: 'create',
        name: 'FilingCreate',
        component: FilingFormView,
        meta: { requiresAuth: true },
      },
      {
        path: 'edit/:id',
        name: 'FilingEdit',
        component: FilingFormView,
        meta: { requiresAuth: true },
      },
      {
        path: 'preview/:id',
        name: 'FilingPreview',
        component: FilingFormView,
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
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
      // 验证成功 -> 替换当前 URL (去掉 ticket), 继续流程
      next({ path: to.path, query, replace: true })
    } else {
      MessagePlugin.error('登录验证失败, 请尝试刷新页面或联系管理员')
      next({ path: to.path, query, replace: true })
    }
    return
  }

  const isDevMode = import.meta.env.VITE_DISABLE_CAS === 'true'

  // 检查用户登录状态
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    if (isDevMode) {
      // 开发模式: 直接后台登录, 完成后继续导航
      await authStore.login()
      if (authStore.isLoggedIn) {
        next()
        return
      }
    }
    // CAS 模式: 跳转 CAS 登录页
    authStore.login()
    next(false)
    return
  }

  // 已有 Token 但内存中无用户信息 (页面刷新)
  if (authStore.isLoggedIn && !authStore.currentUser) {
    await authStore.initAuth()
    if (!authStore.isLoggedIn) {
      if (isDevMode) {
        await authStore.login()
        next()
        return
      }
      authStore.login()
      next(false)
      return
    }
  }
  // 只有状态依然正常, 才放行
  next()
})

export default router
