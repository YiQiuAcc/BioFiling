import { NextFunction, Request, Response } from 'express'
import { validateCasTicket } from '@/utils/cas'
import { generateToken } from '@/utils/jwt'
import logger from '@/utils/logger'
import { ApiResponse, LoginResponse, User } from '@/types'

// 读取管理员列表配置
const ADMIN_IDS = process.env.ADMIN_IDS?.split(',') || []

/**
 * 处理 CAS Ticket 验证请求
 * POST /api/auth/cas/validate
 */
export const validateTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { ticket, service } = req.body

    if (!ticket || !service) {
      res
        .status(400)
        .json({ message: '缺少 ticket 或 service 参数' } as ApiResponse)
      return
    }

    // 调用 CAS 验证
    const casResult = await validateCasTicket(ticket, service)

    if (!casResult.valid || !casResult.user) {
      logger.warn(`[Auth] CAS 验证失败: ${casResult.message}`)
      res.status(401).json({
        message: casResult.message || '身份认证失效，请重新登录',
      } as ApiResponse)
      return
    }

    // 提取用户信息
    const netId = casResult.user
    const attributes = casResult.attributes || {}

    // 如果 CAS 返回的是 Unicode/中文，会自动处理
    const name = attributes['cas:username'] || attributes['cas:cn'] || netId

    // 计算权限
    const isAdmin = ADMIN_IDS.includes(netId)

    // 构建 Payload (将存入 Token 的数据)
    const payload: User = {
      netId,
      name,
      isAdmin,
    }

    // 生成 Token
    const token = generateToken(payload)

    logger.info(`[Auth] 用户登录成功: ${name} (${netId})`)

    res.status(200).json({
      message: '登录成功',
      data: {
        token,
        user: payload, // 前端 Pinia 会存储这个对象
      },
    } as ApiResponse<LoginResponse>)
  } catch (error) {
    logger.error(`[Auth] 登录异常: ${error}`)
    res.status(500).json({ message: '登录失败' } as ApiResponse)
    next(error)
  }
}

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
export const getCurrentUser = (req: Request, res: Response) => {
  // req.user 由 authenticate 中间件注入
  if (!req.user) {
    res.status(401).json({ message: 'Token 无效或已过期' } as ApiResponse)
    return
  }

  res
    .status(200)
    .json({ message: '用户获取成功', data: req.user } as ApiResponse<User>)
}
