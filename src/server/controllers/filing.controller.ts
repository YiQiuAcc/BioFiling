import { Request, Response } from 'express'
import logger from '@/utils/logger'
import { docxService } from '@/services/docx.service'
import { filingService } from '@/services/filing.service'

/**
 * 提交表单并立即生成 Word 下载
 * POST /api/filings/submit
 */
export const submitAndGenerate = async (req: Request, res: Response) => {
  try {
    // 获取用户信息 (由 auth 中间件保证不为空)
    const user = req.user!
    const formData = req.body
    if (!formData || Object.keys(formData).length === 0) {
      res.status(400).json({ message: '提交数据不能为空' })
      return
    }
    // 存入数据库 (获取生成的 record.id)
    const record = await filingService.createRecord(formData, {
      netId: user.netId,
      name: user.name,
    })

    logger.info(`Filing created: id=${record.id} by ${user.netId}`)

    // 准备 Word 渲染数据
    // 将“数据库生成的ID”和“格式化时间”注入到模板数据中
    const renderData = {
      ...formData, // 展开用户填写的字段

      // --- 系统注入字段 (对应 Word 模板里的 {{systemId}}, {{submitDate}} 等) ---
      // 提交时间
      submitDate: record.createdAt.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }

    // 生成 Word Buffer
    const buffer = await docxService.generateBuffer(renderData)

    // 设置响应头，触发浏览器下载
    const filenameStr = formData.projectName || '备案表'
    const filename = encodeURIComponent(`${filenameStr}.docx`)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    // filename* 用于处理中文文件名的兼容性
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=utf-8''${filename}`,
    )
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
    res.send(buffer)
  } catch (e) {
    logger.error('Submit Error:', e)
    res.status(500).json({
      message: '提交或生成文件失败',
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

/**
 * 获取我的提交记录列表
 * GET /api/filings/my
 */
export const getMyRecords = async (req: Request, res: Response) => {
  try {
    const records = await filingService.getUserRecords(req.user!.netId)
    res.status(200).json(records)
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
    // 区分“无权”和“服务器错误”
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('无权') || msg.includes('不存在')) {
      res.status(403).json({ message: msg })
    } else {
      logger.error('Delete Error:', e)
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}
