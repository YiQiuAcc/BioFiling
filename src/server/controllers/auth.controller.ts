import { z } from 'zod'
import { Request, Response } from 'express'
import { validateCasTicket } from '@/utils/cas'
import { UnauthorizedError } from '@/utils/errors'
import { generateToken } from '@/utils/jwt'
import logger from '@/utils/logger'
import { asyncHandler } from '@/middlewares/errorHandler'
import { ApiResponse, LoginResponse, User } from '@/types'

// 管理员名单
const ADMIN_IDS_SET = new Set(
  (process.env.ADMIN_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
)

// 定义 Zod 入参校验 Schema
const loginSchema = z.object({
  ticket: z.string({ required_error: 'Ticket 不能为空' }).min(1),
  service: z
    .string({ required_error: 'Service URL 不能为空' })
    .url('Service 格式错误'),
})

/**
 * 处理 CAS Ticket 验证请求
 * POST /api/auth/cas/validate
 */
export const validateTicket = asyncHandler(
  async (req: Request, res: Response) => {
    // 自动校验入参, 失败会自动抛出 ZodError, 被全局 errorHandler 捕获并返回 400
    const { ticket, service } = loginSchema.parse(req.body)
    // 调用 CAS 验证
    const casResult = await validateCasTicket(ticket, service)
    if (!casResult.valid || !casResult.user) {
      logger.warn(`[Auth] CAS 验证失败: ${casResult.message}`)
      throw new UnauthorizedError(
        casResult.message || '身份认证失效, 请重新登录',
      )
    }

    // 提取用户信息
    const netId = casResult.user
    const attributes = casResult.attributes || {}
    const name = attributes['cas:username'] || attributes['cas:cn'] || netId
    const isAdmin = ADMIN_IDS_SET.has(netId)

    // 构建 Payload
    const payload: User = {
      netId,
      name,
      isAdmin,
    }

    // 生成 Token
    const token = generateToken(payload)
    logger.info(`[Auth] 用户登录成功: ${name} (${netId})`)

    const response: ApiResponse<LoginResponse> = {
      message: '登录成功',
      data: {
        token,
        user: payload,
      },
    }

    res.status(200).json(response)
  },
)

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('无法获取用户信息')
  }

  const response: ApiResponse<User> = {
    message: '用户获取成功',
    data: req.user,
  }

  res.status(200).json(response)
}
