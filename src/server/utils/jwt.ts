import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '@/utils/errors'
import logger from '@/utils/logger'
import { type User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET is not defined in environment variables')
  process.exit(1)
}

// 管理员名单
const ADMIN_IDS_SET = new Set(
  (process.env.ADMIN_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean), // 过滤空字符串
)

/**
 * 生成 JWT Token
 */
export const generateToken = (payload: User) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '8h',
  })
}

/**
 * 验证 Token 并注入用户信息
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('未提供 Token 或格式错误'))
  }

  const token = authHeader.split(' ')[1]
  try {
    // 验证并解码
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as User
    const isAdmin = ADMIN_IDS_SET.has(decoded.netId)
    req.user = {
      netId: decoded.netId,
      name: decoded.name,
      isAdmin: isAdmin,
    }

    next()
  } catch (error) {
    logger.warn(`Auth failed: ${(error as Error).message}`)
    next(new UnauthorizedError('Token 无效或已过期'))
  }
}
