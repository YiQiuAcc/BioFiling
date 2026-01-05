import { Request, Response } from 'express'

export const getInfo = async (req: Request, res: Response) => {
  // req.user 已经在 authenticate 中间件中被赋值 (JWT)
  const user = req.user

  if (!user) {
    res.status(401).json({ message: '未登录' })
    return
  }

  res.status(200).json(user)
}
