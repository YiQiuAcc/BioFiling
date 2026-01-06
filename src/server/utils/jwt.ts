import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '@/utils/errors'
import logger from '@/utils/logger'
import { type User } from '@/types'

const ADMIN_IDS = process.env.ADMIN_IDS?.split(',')

const checkEnv = () => {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not defined in environment variables')
    throw new Error('JWT_SECRET is not defined')
  }
}

/**
 * 生成 JWT Token
 * @param payload 包含 netId, name, isAdmin
 */
export const generateToken = (payload: User) => {
  checkEnv()
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: '8h',
  })
}

/**
 * 中间件：验证 Token 并注入用户信息
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  checkEnv()
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('未提供 Token 或格式错误'))
  }

  try {
    const token = authHeader.split(' ')[1]
    // 验证并解码
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as User
    // 管理员白名单
    const isAdmin = ADMIN_IDS?.includes(decoded.netId)

    // 将解码后的用户信息直接注入 request
    req.user = {
      netId: decoded.netId,
      name: decoded.name,
      isAdmin: isAdmin,
    }
    next()
  } catch (error) {
    logger.warn(
      `Auth failed: ${error instanceof Error ? error.message : error}`,
    )
    next(new UnauthorizedError('Token 无效或已过期'))
  }
}
