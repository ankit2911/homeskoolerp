import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Resetting the global instance to force a refresh with new schema
export const db = new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
