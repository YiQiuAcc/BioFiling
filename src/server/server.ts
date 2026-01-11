import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import path from 'path'
import logger from '@/utils/logger'
import { prisma } from '@/utils/prisma'
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler'
import { morganMiddleware } from '@/middlewares/morgan'
import router from '@/routes/index'

const app = express()

// 如果有 Nginx, 设为 1；如果没有代理, 设为 false
// app.set('trust proxy', 1)

const PORT = process.env.PORT || '3000'
// 全局异常处理, 使用 logger 记录未捕获的异常
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  })
  // 在 uncaughtException 后进程状态可能已经不稳定, 退出进程
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', { reason })
})

// 基础中间件
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
})
app.use('/api/', apiLimiter)

// HTTP 请求日志 (morgan)
app.use(morganMiddleware)

// 数据解析
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 业务路由 (按照顺序: 路由 -> 404 -> 全局错误)
app.use('/api', router)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
// 错误处理
app.use(notFoundHandler) // 处理找不到的路由
app.use(errorHandler) // 处理所有抛出的错误

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`)
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`🔗 API endpoints:`)
  logger.info(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth`)
  logger.info(`📋 Filing endpoints: http://localhost:${PORT}/api/filing`)
})

// 处理关闭信号
const handleShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`)
  server.close(() => {
    logger.info('✅ HTTP server closed')
    // 断开数据库连接
    prisma
      .$disconnect()
      .then(() => logger.info('✅ Database connection closed'))
      .catch((err) =>
        logger.error('❌ Error disconnecting from database:', err),
      )
      .finally(() => process.exit(0))
  })
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'))
process.on('SIGINT', () => handleShutdown('SIGINT'))
