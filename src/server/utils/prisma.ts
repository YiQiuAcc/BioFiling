import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prismaInstance = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
})

export const prisma = globalForPrisma.prisma || prismaInstance

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
