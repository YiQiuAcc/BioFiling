import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import fs from 'fs'
import path from 'path'
import logger from '@/utils/logger'
import { PrismaClient } from '@/generated/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export let prisma: PrismaClient

export async function initializePrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma
    return prisma
  }

  const rawPath =
    process.env.SQLITE_FALLBACK_PATH || 'file:./prisma/fallback.db'

  const filePath = path.resolve(rawPath.replace(/^file:/, ''))
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const sqliteUrl = `file:${filePath}`

  // 先用 raw libsql client 建表，然后关闭避免文件锁冲突
  const setupClient = createClient({ url: sqliteUrl })
  try {
    await setupClient.executeMultiple(`
      CREATE TABLE IF NOT EXISTS forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        department TEXT,
        leader_name TEXT,
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        audit_comment TEXT,
        content TEXT NOT NULL DEFAULT '{}',
        submitter_id TEXT NOT NULL,
        submitter_name TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_forms_submitter_id ON forms(submitter_id);
      CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
      CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at);
    `)
  } finally {
    setupClient.close()
  }

  prisma = new PrismaClient({
    adapter: new PrismaLibSql({ url: sqliteUrl }),
  })

  logger.info(`Connected to SQLite database: ${sqliteUrl}`)

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }

  return prisma
}
