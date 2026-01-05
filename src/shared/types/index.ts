// 用户信息接口
interface User {
  netId: string
  name: string
  isAdmin?: boolean
}

interface AuthPayload {
  netId: string
  name: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export type { User, AuthPayload }
