import { Request, Response } from 'express'
import { ApiResponse, User } from '@/types'

export const getInfo = async (req: Request, res: Response) => {
  // req.user 已经在 authenticate 中间件中被赋值 (JWT)
  const user = req.user

  if (!user) {
    res.status(401).json({ message: '未登录' } as ApiResponse)
    return
  }

  res.status(200).json({ message: '获取成功', data: user } as ApiResponse<User>)
}
