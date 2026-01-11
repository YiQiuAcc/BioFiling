import archiver from 'archiver'
import { createReport } from 'docx-templates'
import fs from 'fs/promises'
import path from 'path'
import logger from '@/utils/logger'
import { prisma } from '@/utils/prisma'
import { DocxRenderData, DocxTemplateImage } from '@/types'
import { filingService } from './filing.service'

const TEMPLATE_FILENAME = 'template.docx'
const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads')

/**
 * 异步读取图片
 */
const getImageDataFromPath = async (
  urlPath: string,
): Promise<DocxTemplateImage | null> => {
  if (!urlPath) return null

  try {
    // 防止路径穿越
    const relativePath = urlPath.replace(/^[\/\\]/, '') // 去除开头的 / 或 \
    const absolutePath = path.resolve(process.cwd(), relativePath)

    if (!absolutePath.startsWith(UPLOADS_ROOT)) {
      logger.warn(`尝试读取非法目录文件: ${absolutePath}`)
      return null
    }

    // 检查文件权限和存在性
    await fs.access(absolutePath)

    // 异步读取
    const buffer = await fs.readFile(absolutePath)
    const ext = path.extname(absolutePath).toLowerCase()
    const normalizedExt = ext === '.jpg' ? '.jpeg' : ext

    return {
      width: 6,
      height: 4,
      data: buffer,
      extension: normalizedExt,
    }
  } catch (e) {
    logger.debug(`读取图片失败 [${urlPath}]: ${(e as Error).message}`)
    return null
  }
}

/**
 * 准备渲染数据 (注入图片)
 */
const prepareRenderData = async (
  data: Record<string, any>,
): Promise<DocxRenderData> => {
  const processed = { ...data } as DocxRenderData
  // 异步处理图片 (Promise.all 提升性能)
  if (
    Array.isArray(data.certifyImagesPath) &&
    data.certifyImagesPath.length > 0
  ) {
    const imagePromises = data.certifyImagesPath.map((p: string) =>
      getImageDataFromPath(p),
    )
    const images = (await Promise.all(imagePromises)).filter(
      (img): img is DocxTemplateImage => img !== null,
    )
    processed.certifyImagesPath = images
  } else {
    processed.certifyImagesPath = []
  }
  return processed
}

export const docxService = {
  /**
   * 单文件 Buffer 生成
   */
  async generateBuffer(data: Record<string, any>): Promise<Buffer> {
    const templatePath = path.resolve(process.cwd(), TEMPLATE_FILENAME)
    // 异步读取模板
    let template: Buffer
    try {
      template = await fs.readFile(templatePath)
    } catch {
      throw new Error('Word 模板文件不存在')
    }

    const finalData = await prepareRenderData(data)
    const report = await createReport({
      template,
      data: finalData,
      cmdDelimiter: ['+++', '+++'],
      failFast: true,
    })

    return Buffer.from(report)
  },

  /**
   * 创建 Zip 流 (批量导出)
   */
  async createZipStream(recordIds: number[]): Promise<archiver.Archiver> {
    const archive = archiver('zip', { zlib: { level: 9 } })
    // 后台执行生成任务
    ;(async () => {
      try {
        const templatePath = path.resolve(process.cwd(), TEMPLATE_FILENAME)
        const template = await fs.readFile(templatePath).catch(() => {
          throw new Error('模板文件缺失')
        })
        // 批量获取数据 (只查询需要的 ID)
        const records = await prisma.forms.findMany({
          where: { id: { in: recordIds } },
        })

        if (records.length === 0) {
          archive.append('没有找到可导出的记录', { name: 'README.txt' })
          await archive.finalize()
          return
        }
        // 串行生成 (避免内存溢出)
        for (const record of records) {
          try {
            if (!record.content) continue
            // 格式化基础数据
            const baseData = filingService.formatRecordForDocx(record)
            // 注入图片 (包含异步 IO)
            const finalData = await prepareRenderData(baseData)
            const buffer = await createReport({
              template,
              data: finalData,
              cmdDelimiter: ['+++', '+++'],
              failFast: false, // 单个失败不影响整体
            })
            // 安全文件名
            const safeName = (record.projectName || '未命名')
              .replace(/[\\/:*?"<>|]/g, '_')
              .replace(/\s+/g, '')
            const fileName = `${String(record.id).padStart(4, '0')}_${safeName}.docx`
            archive.append(Buffer.from(buffer), { name: fileName })
          } catch (err) {
            logger.error(`导出记录 ID ${record.id} 失败`, err)
            archive.append(
              `生成失败 ID ${record.id}: ${(err as Error).message}`,
              { name: `ERROR_${record.id}.txt` },
            )
          }
        }
      } catch (fatalError) {
        logger.error('[DOCX] ZIP 流生成错误', fatalError)
        // 在压缩包内放入错误日志
        archive.append(`系统错误: ${(fatalError as Error).message}`, {
          name: 'SYSTEM_ERROR.txt',
        })
      } finally {
        // 结束流
        await archive.finalize()
      }
    })()
    return archive
  },
}
