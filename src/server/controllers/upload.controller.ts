import { Request, Response } from 'express'
import path from 'path'
import { ValidationError } from '@/utils/errors'
import { asyncHandler } from '@/middlewares/errorHandler'
import { ApiResponse, ImageUploadResponse } from '@/types'

const UPLOAD_DIR_NAME = 'uploads'
const STATIC_BASE_URL = `/${UPLOAD_DIR_NAME}`

export const uploadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError('未检测到文件, 请选择要上传的图片')
    }

    const file = req.file

    // path.relative 计算相对路径, replace 将 Windows 的 \ 强制转换为 Web 标准的 /
    const relativePath = path
      .relative(path.join(process.cwd(), UPLOAD_DIR_NAME), file.path)
      .replace(/\\/g, '/')
    const fileUrl = `${STATIC_BASE_URL}/${relativePath}`

    const responseData = {
      url: fileUrl,
      dbPath: relativePath,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }

    const response: ApiResponse<typeof responseData> = {
      code: 0,
      message: '上传成功',
      data: responseData,
    } as ImageUploadResponse
    res.status(200).json(response)
  },
)
