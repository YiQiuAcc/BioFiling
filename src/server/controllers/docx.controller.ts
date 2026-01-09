import { Request, Response } from 'express'
import logger from '@/utils/logger'
import { docxService } from '@/services/docx.service'
import { filingService } from '@/services/filing.service'
import { ApiResponse } from '@/types'

export const exportAllSubmissions = async (req: Request, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      res.status(403).json({ message: '无权操作' } as ApiResponse)
      return
    }
    const records = await filingService.getAllRecords()
    if (!records?.length) {
      res.status(404).json({ message: '暂无记录可导出' } as ApiResponse)
      return
    }
    const ids = records.map((r) => r.id)
    const filename = encodeURIComponent(`所有备案表汇总_${Date.now()}.zip`)
    // 设置响应头
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
    const archive = await docxService.createZipStream(ids)
    // 监听归档错误
    archive.on('error', (err: Error) => {
      logger.error('Archive stream error:', err)
      if (!res.headersSent) {
        res.status(500).json({ message: '压缩文件生成失败' } as ApiResponse)
      } else {
        res.end() // 如果已经开始传输，直接结束
      }
    })
    // 监听客户端断开连接
    req.on('close', () => {
      if (!res.writableEnded) {
        logger.warn('Client disconnected during streaming')
        archive.abort()
      }
    })
    // 监听响应流错误
    res.on('error', (err: Error) => {
      logger.error('Response stream error:', err)
      archive.abort()
    })
    // 监听完成事件
    archive.on('finish', () => {
      logger.info(`Archive stream completed for ${records.length} records`)
    })
    // 管道传输
    archive.pipe(res)
  } catch (e) {
    logger.error('Export controller error:', e)
    if (!res.headersSent) {
      res.status(500).json({ message: '导出请求失败' } as ApiResponse)
    }
  }
}
