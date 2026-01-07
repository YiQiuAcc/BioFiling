import type { FormDataState } from '../validation/forms.schemas'

// 用户信息接口
interface User {
  netId: string
  name: string
  isAdmin?: boolean
}

interface LoginResponse {
  token: string
  user: User
}

interface FilingRecord {
  leaderName: string | null
  department: string | null
  projectName: string
  status: string
  id: number
  createdAt: Date
}

interface ApiResponse<T = void> {
  message: string
  data?: T
}

interface ImageUploadResponse extends ApiResponse<{
  url: string
  dbPath: string
  originalName: string
  size: number
  mimetype: string
}> {
  code: number
}

interface DocxTemplateImage {
  width: number
  height: number
  data: Buffer | string // Base64 或 Buffer
  extension: string
}

type DocxRenderData = Omit<FormDataState, 'certifyImagesPath'> & {
  certifyImagesPath?: DocxTemplateImage[] // 变为图片对象数组
  // 系统注入字段
  systemId?: string
  submitDate?: string
  submitterName?: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export type {
  User,
  LoginResponse,
  ApiResponse,
  ImageUploadResponse,
  FilingRecord,
  DocxTemplateImage,
  DocxRenderData,
}
