import { Router } from 'express'
import { authenticate } from '@/utils/jwt'
import {
  devLogin,
  getCurrentUser,
  validateTicket,
} from '@/controllers/auth.controller'

const router = Router()

// CAS 票据验证路由
// POST /api/auth/cas/validate
router.post('/cas/validate', validateTicket)

// 开发模式登录 (跳过 CAS)
// POST /api/auth/dev/login
router.post('/dev/login', devLogin)

// 获取当前用户信息 (需要 Token 验证)
// GET /api/auth/me
router.get('/me', authenticate, getCurrentUser)

export default router
