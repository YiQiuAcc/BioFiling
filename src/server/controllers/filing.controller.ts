import { ZodError } from 'zod'
import { Request, Response } from 'express'
import logger from '@/utils/logger'
import { formDataSchema } from '@/types/index'
import { docxService } from '@/services/docx.service'
import { filingService } from '@/services/filing.service'

/**
 * 提交表单 (仅保存)
 * POST /api/filings/submit
 */
export const submit = async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const formData = req.body
    if (!formData || Object.keys(formData).length === 0) {
      res.status(400).json({ message: '提交数据不能为空' })
      return
    }

    // 使用Zod验证数据
    const validatedData = formDataSchema.parse(formData)

    // 存入数据库
    const record = await filingService.createRecord(validatedData, {
      netId: user.netId,
      name: user.name,
    })

    logger.info(`Filing created: id=${record.id} by ${user.netId}`)

    // 返回标准化的成功响应
    res.status(200).json({
      message: '提交成功',
      data: { id: record.id },
    })
  } catch (e) {
    logger.error('Submit Error:', e)
    // 如果是Zod验证错误，返回400状态码
    if (e instanceof ZodError) {
      res.status(400).json({
        message: '提交数据验证失败',
        error: e.errors,
      })
    } else {
      res.status(500).json({
        message: '提交失败',
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }
}

/**
 * 下载单个备案文档
 * GET /api/filings/:id/download
 */
export const downloadRecord = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const user = req.user!

    if (isNaN(id)) {
      res.status(400).json({ message: '无效的 ID' })
      return
    }

    // 获取记录
    const record = await filingService.getRecordById(id)
    if (!record) {
      res.status(404).json({ message: '记录不存在' })
      return
    }

    // 权限校验 (仅管理员或本人可下载)
    if (!user.isAdmin && record.submitterId !== user.netId) {
      res.status(403).json({ message: '无权下载此记录' })
      return
    }

    // 准备渲染数据
    const formData = record.content as Record<string, any>
    const renderData = {
      ...formData, // 展开存储的表单数据

      // 注入系统生成的字段
      systemId: String(record.id).padStart(6, '0'),
      submitDate: record.createdAt.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      submitterName: record.submitterName,
    }

    // 生成 Word Buffer
    const buffer = await docxService.generateBuffer(renderData)

    // 发送响应
    const filenameStr = record.projectName || '备案表'
    const filename = encodeURIComponent(`${filenameStr}.docx`)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=utf-8''${filename}`,
    )
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
    res.send(buffer)
  } catch (e) {
    logger.error(`Download Error (ID: ${req.params.id}):`, e)
    res.status(500).json({ message: '文档生成失败' })
  }
}

/**
 * 获取我的提交记录列表
 * GET /api/filings/my
 */
export const getMyRecords = async (req: Request, res: Response) => {
  try {
    const records = await filingService.getUserRecords(req.user!.netId)
    res.status(200).json({
      message: '获取记录成功',
      data: records,
    })
  } catch (e) {
    logger.error('Get Records Error:', e)
    res.status(500).json({ message: '获取记录失败' })
  }
}

/**
 * 删除记录
 * DELETE /api/filings/:id
 */
export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ message: '无效的 ID' })
      return
    }

    await filingService.deleteRecord(
      id,
      req.user!.netId,
      req.user!.isAdmin || false,
    )

    res.status(200).json({ message: '删除成功' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('无权') || msg.includes('不存在')) {
      res.status(403).json({ message: msg })
    } else {
      logger.error('Delete Error:', e)
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}
