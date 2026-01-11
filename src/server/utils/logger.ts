import fs from 'fs'
import path from 'path'
import winston from 'winston'

const logDir = 'logs'
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

// 开发环境：颜色 + 文本
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} ${level}: ${message} ${stack ? `\n${stack}` : ''}`
  }),
)

// 生产环境：JSON (便于机器解析, ELK/Datadog)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

// 创建 Logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: process.env.NODE_ENV === 'development' ? devFormat : prodFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console(),
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'all.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
})

export default logger
