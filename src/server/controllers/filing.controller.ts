import { z } from 'zod'
import { Request, Response } from 'express'
import { ForbiddenError } from '@/utils/errors'
import { asyncHandler } from '@/middlewares/errorHandler'
import { filingService } from '@/services/filing.service'
import { ApiResponse, FilingDetail, FilingRecord } from '@/types'
import { formDataSchema } from '../../shared/validation/validation.schemas'

// ID 参数校验 Schema
const paramsSchema = z.object({
  id: z.coerce.number().int().positive({ message: '无效的 ID 格式' }),
})

// 审核校验 Schema
const auditSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: '无效的审核状态' }),
  }),
  comment: z.string().optional(),
})

/**
 * 提交备案
 */
export const submit = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  // Zod 校验 body
  const validatedData = formDataSchema.parse(req.body)

  const record = await filingService.createRecord(validatedData, {
    netId: user.netId,
    name: user.name,
  })

  const response: ApiResponse<number> = {
    message: '备案提交成功',
    data: record.id,
  }
  res.status(200).json(response)
})

/**
 * 获取我的记录
 */
export const getMyRecords = asyncHandler(
  async (req: Request, res: Response) => {
    const rawRecords = await filingService.getUserRecords(req.user!.netId)

    const viewModels = rawRecords.map((record) => ({
      ...record,
      createdAt: record.createdAt.toLocaleString('zh-CN', { hour12: false }),
    }))

    const response: ApiResponse<typeof viewModels> = {
      message: '获取备案记录成功',
      data: viewModels,
    }
    res.status(200).json(response)
  },
)

/**
 * 删除记录
 */
export const deleteRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = paramsSchema.parse(req.params)

    await filingService.deleteRecord(
      id,
      req.user!.netId,
      req.user!.isAdmin || false,
    )

    res.status(200).json({ message: '删除成功' } as ApiResponse)
  },
)

/**
 * 获取记录详情
 */
export const getRecordDetail = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = paramsSchema.parse(req.params)

    const record = await filingService.checkAccess(id, {
      netId: req.user!.netId,
      isAdmin: req.user!.isAdmin,
    })

    const content = (record.content as Record<string, unknown>) || {}

    // 扁平化数据结构
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

    const response: ApiResponse<FilingDetail> = {
      message: '获取详情成功',
      data: flattenedRecord as unknown as FilingDetail,
    }
    res.status(200).json(response)
  },
)

/**
 * 更新记录
 */
export const updateRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = paramsSchema.parse(req.params)
    const user = req.user!
    const validatedData = formDataSchema.parse(req.body)

    await filingService.updateRecord(
      id,
      validatedData,
      user.netId,
      user.isAdmin || false,
    )

    res.status(200).json({ message: '更新成功' } as ApiResponse)
  },
)

/**
 * 获取所有记录 (管理员)
 */
export const getAllRecords = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      throw new ForbiddenError('无权查看所有记录')
    }

    const { keyword, status } = req.query
    const records = await filingService.getAllRecords({
      keyword: keyword as string,
      status: status as string,
    })

    const viewModels = records.map((record) => ({
      ...record,
      createdAt: record.createdAt.toLocaleString('zh-CN', { hour12: false }),
    }))

    const response: ApiResponse<FilingRecord[]> = {
      message: '获取所有记录成功',
      data: viewModels,
    }
    res.status(200).json(response)
  },
)

/**
 * 审核记录 (管理员)
 */
export const audit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = paramsSchema.parse(req.params)
  if (!req.user?.isAdmin) throw new ForbiddenError('无权审核')

  // 使用 Zod 校验 body 参数
  const { status, comment } = auditSchema.parse(req.body)
  await filingService.auditRecord(id, status, comment)

  res.status(200).json({ message: '审核完成' } as ApiResponse)
})
