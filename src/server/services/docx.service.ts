import archiver from 'archiver'
import { createReport } from 'docx-templates'
import fs from 'fs'
import path from 'path'
import logger from '@/utils/logger'
import { prisma } from '@/utils/prisma'

// 通用图片读取
const getImageDataFromPath = (urlPath: string) => {
  try {
    if (!urlPath) return null

    // 移除开头的 /
    const relativePath = urlPath.replace(/^\//, '')
    const absolutePath = path.resolve(process.cwd(), relativePath)

    if (fs.existsSync(absolutePath)) {
      const ext = path.extname(absolutePath).substring(1)
      const buffer = fs.readFileSync(absolutePath)
      return {
        width: 6,
        height: 4,
        data: buffer,
        extension: ext,
      }
    }
  } catch (e) {
    logger.error(`读取图片失败: ${urlPath}`, e)
  }
  return null
}

// 将路径转为 Word 图片对象
const processDataForTemplate = (data: any) => {
  const processed = { ...data }
  // 显式处理 certifyImagesPath
  if (
    processed.certifyImagesPath &&
    Array.isArray(processed.certifyImagesPath)
  ) {
    processed.certifyImagesPath = processed.certifyImagesPath
      .map((p: string) => getImageDataFromPath(p))
      .filter(Boolean) // 移除读取失败的 null
  }
  return processed
}

export const docxService = {
  // 单文件生成 (用于单个下载/预览)
  async generateBuffer(data: any) {
    const templatePath = path.resolve(process.cwd(), 'template.docx')
    const template = fs.readFileSync(templatePath)
    const processedData = processDataForTemplate(data)

    const buffer = await createReport({
      template,
      data: processedData,
      cmdDelimiter: ['+++', '+++'],
      failFast: false,
    })
    return Buffer.from(buffer)
  },

  /**
   * 创建流式 ZIP (使用 Archiver)
   * 内存占用低，不会一次性把所有文件加载到 RAM
   */
  async createZipStream(recordIds: number[]) {
    // 创建 archiver 实例
    const archive = archiver('zip', {
      zlib: { level: 9 }, // 最高压缩级别
    })

    const templatePath = path.resolve(process.cwd(), 'template.docx') // 修复：路径应为单数形式 template.docx
    if (!fs.existsSync(templatePath)) throw new Error('模板文件不存在')
    const template = fs.readFileSync(templatePath)

    // 异步处理逻辑：一边生成 Word，一边推送到 ZIP 流中
    // 这里不 await 整个循环，而是立即返回 archive 对象供 Controller 使用
    // 具体的生成逻辑在后台执行
    ;(async () => {
      for (const id of recordIds) {
        try {
          const record = await prisma.forms.findUnique({ where: { id } })
          if (!record || !record.content) continue

          const formData = record.content as Record<string, any>

          // 注入系统数据
          const renderData = {
            ...formData,
            systemId: String(record.id).padStart(6, '0'),
            submitDate: record.createdAt.toLocaleDateString('zh-CN'),
            submitterName: record.submitterName,
          }

          const finalData = processDataForTemplate(renderData)

          // 生成 Word Buffer
          const wordBuffer = await createReport({
            template,
            data: finalData,
            cmdDelimiter: ['+++', '+++'],
            failFast: false,
          })

          // 文件名处理 (去除非法字符)
          const safeName = (record.projectName || '未命名').replace(
            /[\\/:*?"<>|]/g,
            '_',
          )
          const fileName = `${String(record.id).padStart(4, '0')}_${safeName}.docx`

          // 添加到 ZIP 流
          archive.append(Buffer.from(wordBuffer), { name: fileName })
        } catch (error) {
          logger.error(`ID ${id} 生成失败`, error)
          // 即使出错，也往 ZIP 里放个错误日志，而不是中断整个下载
          archive.append(Buffer.from(`Error generating file: ${error}`), {
            name: `ERROR_${id}.txt`,
          })
        }
      }
      // 所有数据处理完毕，关闭流
      archive.finalize()
    })().catch((err) => {
      logger.error('ZIP 生成过程严重错误', err)
      archive.abort()
    })
    return archive
  },
}
