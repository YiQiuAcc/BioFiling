import { isAxiosError } from 'axios'
import { ZodError } from 'zod'
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { Prisma } from '@/generated/client'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

// 异步函数包装器
/* eslint-disable @typescript-eslint/no-explicit-any */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 处理器
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const err = new AppError(`Not Found - ${req.originalUrl}`, 404)
  next(err)
}

// 全局错误处理器
export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // Zod 验证错误
  if (err instanceof ZodError) {
    statusCode = 400
    message = '请求参数验证失败'
    // 保留Zod错误的详细信息以便调试
    const errorMessage = err.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    logger.error(`Validation failed: ${errorMessage}`)
  }

  // JWT 认证错误
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = '无效的令牌 (Invalid token)'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = '令牌已过期 (Token expired)'
  }

  // Prisma 数据库错误
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409
      const target = (err.meta?.target as string[])?.join(', ') || 'field'
      message = `数据冲突: ${target} 已存在`
    } else if (err.code === 'P2025') {
      statusCode = 404
      message = '请求的记录不存在'
    } else {
      statusCode = 400 // Prisma 其他已知错误通常是坏请求
      message =
        process.env.NODE_ENV === 'development'
          ? `DB Error: ${err.code}`
          : '数据库操作失败'
    }
  }

  // Axios HTTP 错误
  else if (isAxiosError(err)) {
    statusCode = err.response?.status || 502
    message = err.response?.data?.message || 'External service request failed'

    if (statusCode === 404) {
      message = 'Requested resource not found'
    }
  }

  // 自定义 AppError
  else if (err instanceof AppError) {
    // 已经设置了 statusCode 和 message，不需要额外处理
  }

  // 记录日志
  const logLevel = statusCode >= 500 ? 'error' : 'warn'
  const logData: any = {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  }

  // 在开发环境或500错误时记录更多信息
  if (process.env.NODE_ENV === 'development' || statusCode >= 500) {
    logData.error = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }

    if (req.body && Object.keys(req.body).length > 0) {
      const safeBody = { ...req.body }
      // 移除可能的敏感字段
      const sensitiveFields = ['password', 'secret']
      sensitiveFields.forEach((field) => {
        if (safeBody[field]) safeBody[field] = '***REDACTED***'
      })
      logData.body = safeBody
    }
  }

  logger.log(logLevel, `${statusCode} - ${message}`, logData)

  // 响应
  const response: any = {
    message,
    // 仅在开发环境返回 Zod 详细字段，生产环境只给概览
    errors:
      process.env.NODE_ENV === 'development' && err instanceof ZodError
        ? err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        : undefined,
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}
