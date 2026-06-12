import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaPg } from '@prisma/adapter-pg'
import logger from '@/utils/logger'
import { PrismaClient } from '@/generated/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export let prisma: PrismaClient

async function tryPostgres(): Promise<PrismaClient | null> {
  try {
    const client = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      }),
    })
    await client.$queryRawUnsafe('SELECT 1')
    logger.info('Connected to PostgreSQL database')
    return client
  } catch {
    logger.warn('PostgreSQL unavailable, falling back to SQLite')
    return null
  }
}

async function createSqliteClient(): Promise<PrismaClient> {
  const sqlitePath =
    process.env.SQLITE_FALLBACK_PATH || 'file:./prisma/fallback.db'

  // Use a raw libsql client to run multi-statement schema initialization
  const setupClient = createClient({ url: sqlitePath })
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

  const client = new PrismaClient({
    adapter: new PrismaLibSql({ url: sqlitePath }),
  })

  logger.info(`Connected to SQLite fallback database: ${sqlitePath}`)
  return client
}

export async function initializePrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma
    return prisma
  }

  prisma = (await tryPostgres()) || (await createSqliteClient())

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }

  return prisma
}
