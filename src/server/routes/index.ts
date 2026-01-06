import { Router } from 'express'
import { authenticate } from '@/utils/jwt'
import { ApiResponse } from '@/types'
import authRoutes from './auth.routes'
import docxRoutes from './filing.routes'
import uploadRoutes from './upload.routes'

const router = Router()

// 健康检查
router.get('/health', (_req, res) => {
  res.json({ message: 'ok', timestamp: new Date() } as ApiResponse<Date>)
})

// 认证路由 (CAS & Current User)
// 挂载在 /auth 下 -> /api/auth/cas/validate, /api/auth/me
router.use('/auth', authRoutes)

// 业务路由 (受保护)
router.use('/filings', authenticate, docxRoutes)

router.use('/upload', authenticate, uploadRoutes)

export default router
