// controllers/filing.controller.ts
import { ZodError, ZodIssue } from 'zod'
import { Request, Response } from 'express'
import logger from '@/utils/logger'
import { docxService } from '@/services/docx.service'
import { filingService } from '@/services/filing.service'
import type { ApiResponse, FilingDetail, FilingRecord } from '@/types'
import { formDataSchema } from '../../shared/validation/validation.schemas'

// 确保路径正确

// --- 辅助函数 ---

const parseId = (req: Request): number => {
  const id = Number(req.params.id)
  if (isNaN(id)) throw new Error('INVALID_ID')
  return id
}

// 统一错误处理
const handleError = (res: Response, e: unknown, action: string) => {
  const msg = e instanceof Error ? e.message : String(e)
  logger.error(`${action} Error:`, e)

  if (e instanceof ZodError) {
    return res
      .status(400)
      .json({ message: '数据验证失败', data: e.errors } as ApiResponse<
        ZodIssue[]
      >)
  }
  if (msg === 'INVALID_ID') {
    return res.status(400).json({ message: '无效的 ID' } as ApiResponse)
  }
  if (msg.includes('不存在')) {
    return res.status(404).json({ message: msg } as ApiResponse)
  }
  if (msg.includes('无权') || msg.includes('无法')) {
    return res.status(403).json({ message: msg } as ApiResponse)
  }

  return res.status(500).json({ message: '服务器内部错误' } as ApiResponse)
}

// --- Controllers ---

export const submit = async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const validatedData = formDataSchema.parse(req.body)

    const record = await filingService.createRecord(validatedData, {
      netId: user.netId,
      name: user.name,
    })

    logger.info(`Filing created: id=${record.id} by ${user.netId}`)
    res
      .status(200)
      .json({ message: '备案提交成功', data: record.id } as ApiResponse<number>)
  } catch (e) {
    handleError(res, e, 'Submit')
  }
}

export const downloadRecord = async (req: Request, res: Response) => {
  try {
    const id = parseId(req)
    const user = req.user!

    // 逻辑下沉到 Service，获取处理好的数据
    const { filename, data } = await filingService.getDownloadData(id, {
      netId: user.netId,
      isAdmin: user.isAdmin,
    })

    const buffer = await docxService.generateBuffer(data)
    const encodedFilename = encodeURIComponent(`${filename}.docx`)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodedFilename}"; filename*=utf-8''${encodedFilename}`,
    )
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
    res.send(buffer)
  } catch (e) {
    handleError(res, e, 'Download')
  }
}

export const getMyRecords = async (req: Request, res: Response) => {
  try {
    const rawRecords = await filingService.getUserRecords(req.user!.netId)

    // 解决类型报错：创建一个新对象返回给前端，而不是修改原对象
    // 这样类型推断会根据返回值自动生成，或者显式定义 ViewModel
    const viewModels = rawRecords.map((record) => ({
      ...record,
      createdAt: record.createdAt.toLocaleString('zh-CN', { hour12: false }), // 转换为字符串
    }))

    res.status(200).json({
      message: '获取备案记录成功',
      data: viewModels,
    } as ApiResponse<any[]>)
  } catch (e) {
    handleError(res, e, 'Get My Records')
  }
}

export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const id = parseId(req)
    await filingService.deleteRecord(
      id,
      req.user!.netId,
      req.user!.isAdmin || false,
    )
    res.status(200).json({ message: '删除成功' } as ApiResponse)
  } catch (e) {
    handleError(res, e, 'Delete')
  }
}

export const getRecordDetail = async (req: Request, res: Response) => {
  try {
    const id = parseId(req)
    // 复用 Service 的 checkAccess 逻辑来获取记录并校验权限
    const record = await filingService.checkAccess(id, {
      netId: req.user!.netId,
      isAdmin: req.user!.isAdmin,
    })

    const content = (record.content as Record<string, any>) || {}

    // 扁平化返回
    const flattenedRecord = {
      ...content,
      id: record.id,
      status: record.status,
      auditComment: record.auditComment,
      createdAt: record.createdAt.toLocaleDateString('zh-CN'),
      updatedAt: record.updatedAt.toLocaleDateString('zh-CN'),
      submitterId: record.submitterId,
      submitterName: record.submitterName,
      projectName: record.projectName,
      department: record.department,
      leaderName: record.leaderName,
    }

    res
      .status(200)
      .json({
        message: '获取详情成功',
        data: flattenedRecord,
      } as unknown as ApiResponse<FilingDetail>)
  } catch (e) {
    handleError(res, e, 'Get Detail')
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseId(req)
    const user = req.user!
    const validatedData = formDataSchema.parse(req.body)

    await filingService.updateRecord(
      id,
      validatedData,
      user.netId,
      user.isAdmin || false,
    )
    res.status(200).json({ message: '更新成功' } as ApiResponse)
  } catch (e) {
    handleError(res, e, 'Update')
  }
}

export const getAllRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      throw new Error('无权查看所有记录')
    }
    const { keyword, status } = req.query
    const records = await filingService.getAllRecords({
      keyword: keyword as string,
      status: status as string,
    })
    // 日期格式化
    const viewModels = records.map((record) => ({
      ...record,
      createdAt: record.createdAt.toLocaleString('zh-CN', { hour12: false }), // 转换为字符串
    }))
    res
      .status(200)
      .json({ message: '获取所有记录成功', data: viewModels } as ApiResponse<
        FilingRecord[]
      >)
  } catch (e) {
    handleError(res, e, 'Get All Records')
  }
}

export const audit = async (req: Request, res: Response) => {
  try {
    const id = parseId(req)
    const { status, comment } = req.body

    if (!req.user?.isAdmin) throw new Error('无权审核')
    if (!['APPROVED', 'REJECTED'].includes(status))
      throw new Error('无效的审核状态')

    await filingService.auditRecord(id, status, comment)
    res.status(200).json({ message: '审核完成' } as ApiResponse)
  } catch (e) {
    handleError(res, e, 'Audit')
  }
}
