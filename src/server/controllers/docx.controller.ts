import { z } from 'zod'
import { Request, Response } from 'express'
import { ForbiddenError, NotFoundError } from '@/utils/errors'
import logger from '@/utils/logger'
import { asyncHandler } from '@/middlewares/errorHandler'
import { docxService } from '@/services/docx.service'
import { filingService } from '@/services/filing.service'
import { ApiResponse } from '@/types'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/**
 * 导出单个备案记录为 Word 文档
 * GET /api/filings/:id/export
 */
export const exportFiling = asyncHandler(
  async (req: Request, res: Response) => {
    // 参数校验
    const { id } = paramsSchema.parse(req.params)
    const user = req.user!
    // 获取业务数据
    const { filename, data } = await filingService.getDownloadData(id, {
      netId: user.netId,
      isAdmin: user.isAdmin,
    })

    // 生成 Buffer
    const buffer = await docxService.generateBuffer(data)
    // 使用 encodeURIComponent 处理中文文件名
    const encodedFilename = encodeURIComponent(`${filename}.docx`)

    // 设置响应头
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodedFilename}"; filename*=utf-8''${encodedFilename}`,
    )
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')

    // 发送
    res.send(buffer)
  },
)

/**
 * 批量导出所有提交记录为 ZIP
 * GET /api/filings/exports
 */
export const exportAllSubmissions = asyncHandler(
  async (req: Request, res: Response) => {
    // 权限检查
    if (!req.user?.isAdmin) {
      throw new ForbiddenError('无权操作导出')
    }
    // 获取数据
    const records = await filingService.getAllRecords()
    if (!records?.length) {
      throw new NotFoundError('暂无记录可导出')
    }

    const ids = records.map((r) => r.id)
    const filename = encodeURIComponent(`所有备案表汇总_${Date.now()}.zip`)
    // 设置响应头
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')

    // 创建压缩流
    const archive = await docxService.createZipStream(ids)

    // 错误处理与清理逻辑 (流式)
    // 监听归档内部错误
    archive.on('error', (err: Error) => {
      logger.error('Archive stream error:', err)
      // 如果头信息还没发出去, 可以返回 JSON 错误
      // 如果已经发出去, 只能强行结束流
      if (!res.headersSent) {
        res.status(500).json({ message: '压缩文件生成失败' } as ApiResponse)
      } else {
        res.end()
      }
    })

    // 监听客户端主动断开 (防止服务器端继续压缩浪费资源)
    req.on('close', () => {
      if (!res.writableEnded) {
        logger.warn('Client disconnected during export streaming')
        archive.abort()
      }
    })

    // 监听响应流错误
    res.on('error', (err: Error) => {
      logger.error('Response stream error:', err)
      archive.abort()
    })

    // 监听完成
    archive.on('finish', () => {
      logger.info(`Export completed: ${records.length} records`)
    })

    // 开始传输
    archive.pipe(res)
  },
)
