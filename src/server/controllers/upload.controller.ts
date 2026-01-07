import { Request, Response } from 'express'
import path from 'path'
import { ImageUploadResponse } from '@/types'

// 路由处理函数
export const uploadHandler = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ code: -1, message: '未检测到文件' })
  }

  const file = req.file

  // 计算相对路径
  // path.sep 处理不同系统的路径分隔符 ( \ 与 / )
  const relativePath = path.relative(
    path.resolve(process.cwd(), 'uploads'),
    file.path,
  )

  // 统一分隔符为 '/' (Web)
  const normalizedPath = relativePath.split(path.sep).join('/')

  // 拼接完整的访问 URL
  const fileUrl = `/uploads/${normalizedPath}`

  // 返回给前端
  res.status(200).json({
    code: 0,
    message: '上传成功',
    data: {
      url: fileUrl, // 前端展示用的完整 URL
      dbPath: normalizedPath, // 建议存入数据库的相对路径
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    },
  } as ImageUploadResponse)
}
