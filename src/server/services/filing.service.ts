import fs from 'fs'
import path from 'path'
import { prisma } from '@/utils/prisma'
import { InputJsonValue } from '@/generated/internal/prismaNamespace'
import { FormDataSchemaType } from '@/types'

// 获取正式存储的日期目录 (YYYY/MM)
const getDateDir = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return path.join(year.toString(), month)
}

// 将临时路径移动到正式路径
const moveFileFromTempToFinal = (tempUrlOrPath: string): string => {
  if (!tempUrlOrPath) return tempUrlOrPath

  // 解析路径
  // 前端传回 URL: "/uploads/temp/xxx.jpg" 或 Windows 路径 "uploads\temp\xxx.jpg"
  // 提取文件名
  const fileName = path.basename(tempUrlOrPath)

  // 检查源文件是否存在于 temp 目录
  const tempPath = path.resolve(process.cwd(), 'uploads', 'temp', fileName)

  if (!fs.existsSync(tempPath)) {
    // 如果临时文件不存在，可能已经是正式文件（编辑模式），或者路径错误，直接返回原值
    return tempUrlOrPath
  }

  try {
    // 准备目标目录 (uploads/2026/01)
    const dateDir = getDateDir() // 获取 '2026/01'
    const finalDir = path.resolve(process.cwd(), 'uploads', dateDir)

    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true })
    }

    // 移动文件
    const finalPath = path.join(finalDir, fileName)
    fs.renameSync(tempPath, finalPath)

    // 返回存入数据库的新相对路径 (Web 格式: /uploads/2026/01/xxx.jpg)
    // 统一使用 POSIX 风格的斜杠
    const webPath = `/uploads/${dateDir.split(path.sep).join('/')}/${fileName}`
    return webPath
  } catch (e) {
    console.error(`移动文件失败 ${fileName}:`, e)
    return tempUrlOrPath // 失败则保留原样，避免数据丢失
  }
}

export const filingService = {
  /**
   * 创建备案记录
   */
  async createRecord(
    data: FormDataSchemaType, // 经过 Zod 验证后的数据
    submitter: { netId: string; name: string },
  ) {
    // 拷贝一份数据进行处理，避免修改原始对象
    const processedData = { ...data }

    // === 处理图片字段移动 ===
    // 处理数组类型的图片 (certifyImagesPath)
    if (
      Array.isArray(processedData.certifyImagesPath) &&
      processedData.certifyImagesPath.length > 0
    ) {
      processedData.certifyImagesPath = processedData.certifyImagesPath.map(
        (p: string) => moveFileFromTempToFinal(p),
      )
    }
    // 如果只有单张图片字段，也可以这样处理
    // if (processedData.otherImage) {
    //   processedData.otherImage = moveFileFromTempToFinal(processedData.otherImage);
    // }

    // === 提取索引字段 ===
    const { projectName, department, leaderName } = processedData

    // === 写入数据库 ===
    return await prisma.forms.create({
      data: {
        projectName: projectName || '未命名备案',
        department: department || '',
        leaderName: leaderName || '',
        status: 'SUBMITTED',

        // 存入处理过路径（指向正式目录）的数据
        content: processedData as InputJsonValue,

        submitterId: submitter.netId,
        submitterName: submitter.name,
      },
    })
  },

  /**
   * 获取某个用户的提交历史
   */
  async getUserRecords(netId: string) {
    return await prisma.forms.findMany({
      where: {
        submitterId: netId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      // 仅选择列表需要的字段，避免加载庞大的 content JSON
      select: {
        id: true,
        projectName: true,
        department: true,
        leaderName: true,
        status: true,
        createdAt: true,
      },
    })
  },

  /**
   * (管理员) 获取所有记录
   */
  async getAllRecords() {
    return await prisma.forms.findMany({
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
      },
    })
  },

  /**
   * 删除记录
   */
  async deleteRecord(id: number, operatorNetId: string, isAdmin: boolean) {
    const record = await prisma.forms.findUnique({ where: { id } })

    if (!record) {
      throw new Error('记录不存在')
    }

    // 权限校验：只有管理员或本人可以删除
    if (!isAdmin && record.submitterId !== operatorNetId) {
      throw new Error('无权删除此记录')
    }

    return await prisma.forms.delete({ where: { id } })
  },

  /**
   * 获取单条详情 (用于重新生成文档与查看)
   */
  async getRecordById(id: number) {
    return await prisma.forms.findUnique({ where: { id } })
  },
}
