import { Request, Response } from 'express'
import logger from '@/utils/logger'
import { docxService } from '@/services/docx.service'
import { filingService } from '@/services/filing.service'

export const exportAllSubmissions = async (req: Request, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      res.status(403).json({ message: '无权操作' })
      return
    }
    const records = await filingService.getAllRecords()
    if (!records || records.length === 0) {
      res.status(404).json({ message: '暂无记录可导出' })
      return
    }
    const ids = records.map((r) => r.id)
    const filename = encodeURIComponent(`所有备案表汇总_${Date.now()}.zip`)
    // 设置响应头，告诉浏览器这是一个文件下载
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    // 获取 Zip 流
    const archive = await docxService.createZipStream(ids)
    // 错误监听
    archive.on('error', (err: any) => {
      logger.error('Archive error:', err)
      if (!res.headersSent) {
        res.status(500).json({ message: '压缩文件生成失败' })
      } else {
        res.end()
      }
    })
    // 管道传输：Archiver -> Response
    archive.pipe(res)
  } catch (e) {
    logger.error('Export Controller Error:', e)
    if (!res.headersSent) {
      res.status(500).json({ message: '导出请求失败' })
    }
  }
}
