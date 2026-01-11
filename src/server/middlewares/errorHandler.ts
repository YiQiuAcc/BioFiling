import { isAxiosError } from 'axios'
import { ZodError } from 'zod'
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
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
  let errorsData = undefined

  // 处理自定义 AppError
  if (err instanceof AppError) {
    if (err.details) {
      errorsData = err.details
    }
  }

  // Zod 验证错误
  else if (err instanceof ZodError) {
    statusCode = 400
    message = '请求参数验证失败'
    // 提取结构化的错误信息, 供前端或日志使用
    errorsData = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }))
    message = errorsData.map((e) => `${e.path}: ${e.message}`).join(', ')
    logger.warn('zod验证失败: ' + message)
  }

  // JWT 认证错误
  else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401
    if (err instanceof jwt.TokenExpiredError) {
      message = '令牌已过期 (Token expired)'
    } else if (err instanceof jwt.NotBeforeError) {
      message = '令牌尚未激活 (Token not active)'
    } else {
      message = '无效的令牌 (Invalid token)'
    }
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
      statusCode = 400
      message =
        process.env.NODE_ENV === 'development'
          ? `DB Error: ${err.code}`
          : '数据库操作失败'
    }
  }

  // Axios HTTP 错误
  else if (isAxiosError(err)) {
    statusCode = err.response?.status || 502
    message =
      err.response?.data?.message || err.message || 'External service error'
    if (statusCode === 404) {
      message = 'External resource not found'
    }
  }

  const logLevel = statusCode >= 500 ? 'error' : 'warn'
  // 构建日志对象
  const logData: Record<string, any> = {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    // 记录 Zod 错误详情
    validationErrors: errorsData,
  }

  // 开发环境或严重错误时, 记录更详细的信息
  if (process.env.NODE_ENV === 'development' || statusCode >= 500) {
    logData.stack = err.stack
    logData.originalErrorName = err.name
    // Body 敏感信息脱敏
    if (req.body && Object.keys(req.body).length > 0) {
      const safeBody = { ...req.body }
      const sensitiveFields = ['password', 'token', 'secret', 'authorization']
      sensitiveFields.forEach((field) => {
        // 模糊匹配键名
        Object.keys(safeBody).forEach((key) => {
          if (key.toLowerCase().includes(field))
            safeBody[key] = '***REDACTED***'
        })
      })
      logData.body = safeBody
    }
  }
  // 统一输出日志
  logger.log(logLevel, `${statusCode} - ${message}`, logData)

  const responsePayload: any = { message }

  // 仅在开发环境或是验证错误时返回详细 errors 数组
  if (errorsData) {
    responsePayload.errors = errorsData
  }

  if (process.env.NODE_ENV === 'development') {
    responsePayload.stack = err.stack
  }

  res.status(statusCode).json(responsePayload)
}
