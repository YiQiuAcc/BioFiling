import { Router } from 'express'
import { exportAllSubmissions } from '@/controllers/docx.controller'
import {
  audit,
  deleteRecord,
  downloadRecord,
  getAllRecords,
  getMyRecords,
  getRecordDetail,
  submit,
  updateRecord,
} from '@/controllers/filing.controller'

const router = Router()

// 提交表单
// POST /api/filings/submit
router.post('/submit', submit)

// 获取我的记录
// GET /api/filings/my
router.get('/my', getMyRecords)

// 获取所有记录 (仅管理员)
// GET /api/filings
router.get('/', getAllRecords)

// 导出所有提交 (ZIP)
// GET /api/filings/exports
router.get('/exports', exportAllSubmissions)

// 获取单条记录详情
// GET /api/filings/:id
router.get('/:id', getRecordDetail)

// 下载单个记录文档
// GET /api/filings/:id/download
router.get('/:id/download', downloadRecord)

// 修改备案记录
// PUT /api/filings/:id
router.put('/:id', updateRecord)

// 删除路由
// DELETE /api/filings/:id
router.delete('/:id', deleteRecord)

// 审核路由
// PATCH /api/filings/:id/audit
router.patch('/:id/audit', audit)

export default router
