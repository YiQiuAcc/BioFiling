import archiver from 'archiver'
import { createReport } from 'docx-templates'
import fs from 'fs'
import path from 'path'
import logger from '@/utils/logger'
import { prisma } from '@/utils/prisma'
import { FormDataState, Personnel } from '@/types'
import { DocxRenderData, DocxTemplateImage } from '@/types'

// 常量定义
const TEMPLATE_FILENAME = 'template.docx'
const IMAGE_DEFAULT_WIDTH = 6
const IMAGE_DEFAULT_HEIGHT = 4

/**
 * 读取图片并转换为 docx-templates 需要的对象格式
 */
// docx.service.ts

const getImageDataFromPath = (urlPath: string): DocxTemplateImage | null => {
  if (!urlPath) return null

  try {
    const relativePath = urlPath.replace(/^[\/\\]/, '')
    const absolutePath = path.resolve(process.cwd(), relativePath)

    if (!absolutePath.startsWith(path.resolve(process.cwd(), 'uploads'))) {
      logger.warn(`尝试读取非法目录文件: ${absolutePath}`)
      return null
    }

    if (fs.existsSync(absolutePath)) {
      const ext = path.extname(absolutePath).toLowerCase()
      const buffer = fs.readFileSync(absolutePath)
      const normalizedExt = ext === '.jpg' ? '.jpeg' : ext
      return {
        width: 6,
        height: 4,
        data: buffer,
        extension: normalizedExt,
      }
    }
  } catch (e) {
    logger.error(`读取图片失败: ${urlPath}`, e)
  }
  return null
}
/**
 * 将日期范围字符串数组拆分为模板需要的年、月、日字段
 */
const processDateRange = (dateRange: string[] | undefined) => {
  const result = {
    startYear: '    ',
    startMonth: '  ',
    startDay: '  ',
    endYear: '    ',
    endMonth: '  ',
    endDay: '  ',
  }

  if (Array.isArray(dateRange) && dateRange.length >= 2) {
    // 处理开始时间
    if (dateRange[0]) {
      const parts = dateRange[0].split('-') // 假设格式为 YYYY-MM-DD
      if (parts.length === 3) {
        result.startYear = parts[0]
        result.startMonth = parts[1]
        result.startDay = parts[2]
      }
    }
    // 处理结束时间
    if (dateRange[1]) {
      const parts = dateRange[1].split('-')
      if (parts.length === 3) {
        result.endYear = parts[0]
        result.endMonth = parts[1]
        result.endDay = parts[2]
      }
    }
  }

  return result
}

/**
 * 数据预处理：将数据库的一维数据转换为模板需要的渲染数据，图片路径 -> 图片对象
 */
const processDataForTemplate = (
  data: FormDataState | (FormDataState & Record<string, unknown>),
): DocxRenderData => {
  // 1. 初始化对象 (这里补上类型定义，防止 TS 报错)
  const processed = { ...data } as unknown as DocxRenderData & {
    img?: DocxTemplateImage | null
  }

  // 2. 处理图片字段
  if (
    'certifyImagesPath' in data &&
    Array.isArray(data.certifyImagesPath) &&
    data.certifyImagesPath.length > 0
  ) {
    // 读取图片数组
    const images = data.certifyImagesPath
      .map((p) => getImageDataFromPath(p))
      .filter((img): img is DocxTemplateImage => img !== null)

    // 把处理好的图片数组赋值回去
    processed.certifyImagesPath = images

    // 将数组的第一张图赋值给 img 变量
    // 如果数组有图，取第一张；如果没有，设为 null (防止 undefined 报错)
    processed.img = images.length > 0 ? images[0] : null
  } else {
    processed.certifyImagesPath = []
    // 没有图片路径时，也要定义 img 为 null
    processed.img = null
  }

  // 3. 处理日期
  const dateFields = processDateRange(data.dateRange)
  Object.assign(processed, dateFields)

  return processed
}

export const docxService = {
  /**
   * 单文件生成 (用于单个下载/预览)
   */
  async generateBuffer(data: FormDataState): Promise<Buffer> {
    const templatePath = path.resolve(process.cwd(), TEMPLATE_FILENAME)

    if (!fs.existsSync(templatePath)) {
      throw new Error('Word 模板文件不存在')
    }

    const template = fs.readFileSync(templatePath)
    const processedData = processDataForTemplate(data)

    const buffer = await createReport({
      template,
      data: processedData,
      cmdDelimiter: ['+++', '+++'],
      failFast: true, // 单文件生成有问题直接报错
    })

    return Buffer.from(buffer)
  },

  /**
   * 创建流式 ZIP
   * 批量查询数据库，减少 await 循环中的 IO 等待
   */
  async createZipStream(recordIds: number[]): Promise<archiver.Archiver> {
    // 创建 archiver 实例
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    const templatePath = path.resolve(process.cwd(), TEMPLATE_FILENAME)
    if (!fs.existsSync(templatePath)) {
      // 这里抛出错误，Controller 层可以在流开始前捕获
      throw new Error('模板文件不存在')
    }
    const template = fs.readFileSync(templatePath)

    // 后台异步处理
    ;(async () => {
      try {
        // 批量查询, 如果 id 数量极大（如几千个），这里可能需要分批 (chunk) 查询
        const records = await prisma.forms.findMany({
          where: {
            id: { in: recordIds },
          },
        })

        if (records.length === 0) {
          archive.append('No records found.', { name: 'README.txt' })
        }

        // 如果对顺序无要求，可以使用 Promise.all 进行并发生成，速度更快
        // 但为了控制内存峰值，依然保持串行，或使用 p-limit 控制并发数
        for (const record of records) {
          try {
            if (!record.content) continue

            // 强类型转换,数据库里的 content 符合 FormDataState 结构
            const formData = record.content as unknown as FormDataState

            // 注入系统数据
            const renderData: FormDataState &
              Record<
                string,
                string | string[] | number | Personnel[] | boolean
              > = {
              ...formData,
              systemId: String(record.id).padStart(6, '0'),
              submitDate: record.createdAt.toLocaleDateString('zh-CN'),
              submitterName: record.submitterName || '',
            }

            const finalData = processDataForTemplate(renderData)

            // 生成 Word Buffer
            const wordBuffer = await createReport({
              template,
              data: finalData,
              cmdDelimiter: ['+++', '+++'],
              failFast: false, // 批量导出时，某个字段渲染失败不应中断整个流程
            })

            // 文件名安全处理
            const safeProjectName = (record.projectName || '未命名')
              .replace(/[\\/:*?"<>|]/g, '_')
              .replace(/\s+/g, '') // 去除空格

            const fileName = `${String(record.id).padStart(4, '0')}_${safeProjectName}.docx`

            archive.append(Buffer.from(wordBuffer), { name: fileName })
          } catch (itemError) {
            logger.error(`ID ${record.id} 生成失败`, itemError)
            archive.append(
              Buffer.from(
                `Error generating file for ID ${record.id}: ${String(itemError)}`,
              ),
              { name: `ERROR_${record.id}.txt` },
            )
          }
        }
      } catch (dbError) {
        logger.error('ZIP 生成过程数据库错误', dbError)
        archive.append(Buffer.from(`Database Error: ${String(dbError)}`), {
          name: 'SYSTEM_ERROR.txt',
        })
      } finally {
        archive.finalize()
      }
    })() // IIFE 立即执行

    return archive
  },
}
