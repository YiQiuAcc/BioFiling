import { Router } from 'express'
import { exportAllSubmissions } from '@/controllers/docx.controller'
import {
  deleteRecord,
  getMyRecords,
  submitAndGenerate,
} from '@/controllers/filing.controller'

const router = Router()

// 提交表单并生成文档
// POST /api/filing/submit
router.post('/submit', submitAndGenerate)

// 获取我的记录
// GET /api/filing/my
router.get('/my', getMyRecords)

// 导出所有提交
// GET /api/filing/exports
router.get('/exports', exportAllSubmissions)

// 删除指定ID的记录
// DELETE /api/filing/:id
router.delete('/:id', deleteRecord)

export default router
