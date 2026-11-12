import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma client instance for database operations
// Updated: includes catalogProduct and wholesaler models
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: ['query'],
  })
  
  return client
}

// Always create fresh client to ensure all models are available
// In production, we could optimize this with proper caching
export const db = createPrismaClient()

// Also export PrismaClient for direct instantiation if needed
export { PrismaClient }

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}