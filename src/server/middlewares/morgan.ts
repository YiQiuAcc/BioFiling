import morgan, { StreamOptions } from 'morgan'
import logger from '@/utils/logger'

// 将 Morgan 的输出直接由 Winston 接管
const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
}

// 开发环境格式较短, 生产环境包含更多信息
const format =
  process.env.NODE_ENV === 'production'
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
    : ':method :url :status :response-time ms - :res[content-length]'

export const morganMiddleware = morgan(format, { stream })
