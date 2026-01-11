import { InputJsonValue } from '@prisma/client/runtime/client'
import fs from 'fs/promises'
import path from 'path'
import { ForbiddenError, NotFoundError } from '@/utils/errors'
import logger from '@/utils/logger'
import { prisma } from '@/utils/prisma'
import { FormDataSchemaType, FormDataState, User } from '@/types'

// 配置常量
const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads')
const TEMP_DIR = path.join(UPLOAD_ROOT, 'temp')

/**
 * 获取日期目录 (YYYY/MM)
 */
const getDateDir = () => {
  const now = new Date()
  return path.join(
    now.getFullYear().toString(),
    (now.getMonth() + 1).toString().padStart(2, '0'),
  )
}

/**
 * 移动临时文件到持久化目录
 */
const moveFileFromTempToFinal = async (
  tempUrlOrPath: string,
): Promise<string> => {
  if (!tempUrlOrPath) return tempUrlOrPath
  const fileName = path.basename(tempUrlOrPath)
  const tempPath = path.join(TEMP_DIR, fileName)

  try {
    // 检查文件是否存在
    await fs.access(tempPath)

    const dateDir = getDateDir()
    const finalDir = path.join(UPLOAD_ROOT, dateDir)
    // 递归创建目录
    await fs.mkdir(finalDir, { recursive: true })

    const finalPath = path.join(finalDir, fileName)
    await fs.rename(tempPath, finalPath)

    // 使用 path.posix.join 使用 '/' 作为分隔符
    return `/uploads/${dateDir.split(path.sep).join('/')}/${fileName}`
  } catch (e) {
    // 忽略文件不存在的错误
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`移动文件失败 [${fileName}]:`, e)
    }
    return tempUrlOrPath
  }
}

/**
 * 处理表单中的所有文件字段
 */
const processFormDataFiles = async (data: FormDataSchemaType) => {
  const processed = { ...data }

  // 处理证明图片
  if (
    Array.isArray(processed.certifyImagesPath) &&
    processed.certifyImagesPath.length > 0
  ) {
    // 并发处理所有文件移动
    processed.certifyImagesPath = await Promise.all(
      processed.certifyImagesPath.map((p) => moveFileFromTempToFinal(p)),
    )
  }
  return processed
}

/**
 * 拆分日期范围字符串
 */
const splitDateString = (dateStr?: string) => {
  if (!dateStr) return { year: '    ', month: '  ', day: '  ' }
  const parts = dateStr.split('-')
  return {
    year: parts[0] || '    ',
    month: parts[1] || '  ',
    day: parts[2] || '  ',
  }
}

export const filingService = {
  /**
   * 统一权限检查辅助函数
   */
  async checkAccess(
    recordId: number,
    user: { netId: string; isAdmin?: boolean },
  ) {
    const record = await prisma.forms.findUnique({ where: { id: recordId } })
    if (!record) throw new NotFoundError('备案记录不存在')

    if (!user.isAdmin && record.submitterId !== user.netId) {
      throw new ForbiddenError('无权操作此备案记录')
    }
    return record
  },

  async createRecord(
    data: FormDataSchemaType,
    submitter: { netId: string; name: string },
  ) {
    const processedData = await processFormDataFiles(data)

    return await prisma.forms.create({
      data: {
        projectName: processedData.projectName || '未命名备案',
        department: processedData.department || '',
        leaderName: processedData.leaderName || '',
        status: 'SUBMITTED',
        content: processedData as InputJsonValue,
        submitterId: submitter.netId,
        submitterName: submitter.name,
      },
    })
  },

  async updateRecord(
    id: number,
    data: FormDataSchemaType,
    operatorNetId: string,
    isAdmin: boolean,
  ) {
    const record = await prisma.forms.findUnique({ where: { id } })
    if (!record) throw new NotFoundError('记录不存在')

    // 严格的权限校验逻辑
    if (!isAdmin) {
      if (record.submitterId !== operatorNetId) {
        throw new ForbiddenError('无权修改他人的记录')
      }
      if (record.status === 'APPROVED') {
        throw new ForbiddenError('已通过审核的记录无法修改')
      }
    }

    const processedData = await processFormDataFiles(data)

    return await prisma.forms.update({
      where: { id },
      data: {
        projectName: processedData.projectName,
        department: processedData.department,
        leaderName: processedData.leaderName,
        // 若被驳回, 修改后自动重置为 "SUBMITTED", 管理员修改则保持原状态
        status:
          !isAdmin && record.status === 'REJECTED'
            ? 'SUBMITTED'
            : record.status,
        content: processedData as InputJsonValue,
      },
    })
  },

  async getUserRecords(netId: string) {
    return await prisma.forms.findMany({
      where: { submitterId: netId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        projectName: true,
        department: true,
        leaderName: true,
        submitterName: true,
        status: true,
        createdAt: true,
        auditComment: true,
      },
    })
  },

  async getAllRecords(params: { keyword?: string; status?: string } = {}) {
    const { keyword, status } = params
    const whereClause: any = {}

    if (status) whereClause.status = status
    if (keyword) {
      whereClause.OR = [
        { projectName: { contains: keyword } },
        { submitterName: { contains: keyword } },
        { submitterId: { contains: keyword } },
      ]
    }

    return await prisma.forms.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        projectName: true,
        department: true,
        leaderName: true,
        submitterName: true,
        status: true,
        createdAt: true,
      },
    })
  },

  async deleteRecord(id: number, operatorNetId: string, isAdmin: boolean) {
    await this.checkAccess(id, { netId: operatorNetId, isAdmin })
    return await prisma.forms.delete({ where: { id } })
  },

  async auditRecord(
    id: number,
    status: 'APPROVED' | 'REJECTED',
    comment?: string,
  ) {
    const record = await prisma.forms.findUnique({ where: { id } })
    if (!record) throw new NotFoundError('记录不存在')

    return await prisma.forms.update({
      where: { id },
      data: {
        status,
        auditComment: comment || null,
        updatedAt: new Date(),
      },
    })
  },

  /**
   * 将数据库记录转换为 Word 模板需要的扁平化数据结构
   * 包含所有日期处理和字段映射
   */
  formatRecordForDocx(record: {
    id: number
    projectName: string | null
    submitterName: string | null
    createdAt: Date
    content: InputJsonValue | null
  }) {
    const formData = (record.content || {}) as unknown as FormDataState
    const dateRange = formData.dateRange || []
    // 预处理起止时间
    const startDate = splitDateString(dateRange[0])
    const endDate = splitDateString(dateRange[1])

    // 返回纯净的渲染对象
    return {
      ...formData,
      systemId: String(record.id).padStart(6, '0'),
      submitterName: record.submitterName || '',
      projectName: record.projectName || '未命名',
      // 提交日期
      year: record.createdAt.getFullYear(),
      month: record.createdAt.getMonth() + 1,
      day: record.createdAt.getDate(),
      submitDate: record.createdAt.toLocaleDateString('zh-CN'),
      // 活动起止日期 (扁平化给模板使用)
      startYear: startDate.year,
      startMonth: startDate.month,
      startDay: startDate.day,
      endYear: endDate.year,
      endMonth: endDate.month,
      endDay: endDate.day,
    }
  },

  /**
   * 获取单个下载的完整数据
   */
  async getDownloadData(
    id: number,
    user: { netId: string; isAdmin?: boolean },
  ) {
    const record = await this.checkAccess(id, user)
    const renderData = this.formatRecordForDocx(record)
    return {
      filename: record.projectName || '备案表',
      data: renderData,
    }
  },
}
