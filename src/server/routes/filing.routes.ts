import { Router } from 'express'
import { exportAllSubmissions } from '@/controllers/docx.controller'
import {
  deleteRecord,
  downloadRecord,
  getMyRecords,
  submit,
} from '@/controllers/filing.controller'

const router = Router()

// 提交表单 (仅保存数据)
// POST /api/filings/submit
router.post('/submit', submit)

// 获取我的记录
// GET /api/filings/my
router.get('/my', getMyRecords)

// 导出所有提交 (ZIP)
// GET /api/filings/exports
router.get('/exports', exportAllSubmissions)

// 下载单个记录文档
// GET /api/filings/:id/download
router.get('/:id/download', downloadRecord)

// 删除指定ID的记录
// DELETE /api/filings/:id
router.delete('/:id', deleteRecord)

export default router
