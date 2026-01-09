import fs from 'fs/promises'
import path from 'path'
import logger from '@/utils/logger'
import { prisma } from '@/utils/prisma'
import { InputJsonValue } from '@/generated/internal/prismaNamespace'
import { FormDataSchemaType, FormDataState } from '@/types'

// 常量：日期目录
const getDateDir = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return path.join(year.toString(), month)
}

// 优化：纯异步移动文件，不再使用 fsSync
const moveFileFromTempToFinal = async (
  tempUrlOrPath: string,
): Promise<string> => {
  if (!tempUrlOrPath) return tempUrlOrPath
  const fileName = path.basename(tempUrlOrPath)
  // 假设 temp 目录就在 uploads/temp
  const tempPath = path.resolve(process.cwd(), 'uploads', 'temp', fileName)

  try {
    // 检查临时文件是否存在 (access 失败会抛出异常)
    await fs.access(tempPath)

    const dateDir = getDateDir()
    const finalDir = path.resolve(process.cwd(), 'uploads', dateDir)

    await fs.mkdir(finalDir, { recursive: true })
    const finalPath = path.join(finalDir, fileName)

    await fs.rename(tempPath, finalPath)
    // 返回标准化的 Web 路径
    return `/uploads/${dateDir.split(path.sep).join('/')}/${fileName}`
  } catch (e) {
    // 如果文件不存在或移动失败，记录日志但返回原路径（避免破坏数据完整性）
    // 仅当不是 "文件不存在" 错误时记录 Error
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`移动文件失败 ${fileName}:`, e)
    }
    return tempUrlOrPath
  }
}

const processFormDataFiles = async (data: FormDataSchemaType) => {
  const processed = { ...data }
  if (
    Array.isArray(processed.certifyImagesPath) &&
    processed.certifyImagesPath.length > 0
  ) {
    processed.certifyImagesPath = await Promise.all(
      processed.certifyImagesPath.map((p) => moveFileFromTempToFinal(p)),
    )
  }
  return processed
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
    if (!record) throw new Error('记录不存在')

    if (!user.isAdmin && record.submitterId !== user.netId) {
      throw new Error('无权操作此记录')
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
    if (!record) throw new Error('记录不存在')

    // 权限校验
    if (!isAdmin) {
      if (record.submitterId !== operatorNetId)
        throw new Error('无权修改此记录')
      if (record.status === 'APPROVED')
        throw new Error('已通过审核的记录无法修改')
    }

    const processedData = await processFormDataFiles(data)

    return await prisma.forms.update({
      where: { id },
      data: {
        projectName: processedData.projectName,
        department: processedData.department,
        leaderName: processedData.leaderName,
        // 若被驳回，修改后自动重置为 "SUBMITTED"
        status: record.status === 'REJECTED' ? 'SUBMITTED' : record.status,
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
        submitterId: true,
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
      // 列表页只查必要字段
      select: {
        id: true,
        projectName: true,
        department: true,
        leaderName: true,
        submitterName: true,
        submitterId: true,
        status: true,
        createdAt: true,
      },
    })
  },

  async deleteRecord(id: number, operatorNetId: string, isAdmin: boolean) {
    // 复用 checkAccess 进行存在性和权限检查
    await this.checkAccess(id, { netId: operatorNetId, isAdmin })
    return await prisma.forms.delete({ where: { id } })
  },

  async getRecordById(id: number) {
    return await prisma.forms.findUnique({ where: { id } })
  },

  /**
   * 数据格式化, 将数据库记录转换为 Word 模板需要的扁平化数据结构
   * 供 单个下载 和 批量下载 共同使用，确保数据一致性
   */
  formatRecordForDocx(record: {
    id: number
    projectName: string | null
    submitterName: string | null
    createdAt: Date
    content: InputJsonValue | null
  }) {
    // 类型安全转换
    const formData = (record.content || {}) as unknown as FormDataState
    // 组装渲染数据
    return {
      ...formData,
      systemId: String(record.id).padStart(6, '0'),
      submitterName: record.submitterName || '',
      projectName: record.projectName || '未命名',
      // 统一拆分日期供模板使用
      year: record.createdAt.getFullYear(),
      month: record.createdAt.getMonth() + 1,
      day: record.createdAt.getDate(),
      // 格式化完整日期字符串
      submitDate: record.createdAt.toLocaleDateString('zh-CN'),
    }
  },

  /**
   * 专门用于生成 Word 文档的数据准备方法 (单个下载)
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

  async auditRecord(
    id: number,
    status: 'APPROVED' | 'REJECTED',
    comment?: string,
  ) {
    // 确保记录存在
    const record = await prisma.forms.findUnique({ where: { id } })
    if (!record) throw new Error('记录不存在')

    return await prisma.forms.update({
      where: { id },
      data: {
        status,
        auditComment: comment || null,
        updatedAt: new Date(),
      },
    })
  },
}
