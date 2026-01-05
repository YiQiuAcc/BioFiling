import { Router } from 'express'
import { authenticate } from '@/utils/jwt'
import authRoutes from './auth.routes'
import docxRoutes from './filing.routes'
import uploadRoutes from './upload.routes'

const router = Router()

// 健康检查
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// 认证路由 (CAS & Current User)
// 挂载在 /auth 下 -> /api/auth/cas/validate, /api/auth/me
router.use('/auth', authRoutes)

// 业务路由 (受保护)
// 挂载 filing 相关功能
router.use('/filings', authenticate, docxRoutes)

router.use('/upload', authenticate, uploadRoutes)

export default router
