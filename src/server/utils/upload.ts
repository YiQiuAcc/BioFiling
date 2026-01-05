import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { uuidv7 } from 'uuidv7'

// 基础上传目录
const BASE_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
// 临时目录
const TEMP_DIR = path.join(BASE_UPLOAD_DIR, 'temp')

// 确保临时目录存在
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    // 统一存入 uploads/temp
    cb(null, TEMP_DIR)
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname)
    const filename = `${Date.now()}-${uuidv7()}${ext}`
    cb(null, filename)
  },
})

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('仅支持上传图片格式 (jpg, png, gif, webp等)'))
  }
}

export const uploader = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter,
})
