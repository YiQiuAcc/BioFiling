// 自定义错误类
export class AppError<T = unknown> extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: T

  constructor(message: string, statusCode: number = 500, details?: T) {
    super(message)

    this.name = this.constructor.name
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true

    // 保持正确的原型链
    Object.setPrototypeOf(this, new.target.prototype)
    // 始终捕获堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, 404, details)
  }
}

export class ValidationError<T = unknown> extends AppError<T> {
  constructor(message: string = 'Validation failed', details?: T) {
    super(message, 400, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', details?: unknown) {
    super(message, 401, details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', details?: unknown) {
    super(message, 403, details)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, 409, details)
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 500, details)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = 'Service temporarily unavailable',
    details?: unknown,
  ) {
    super(message, 503, details)
  }
}
