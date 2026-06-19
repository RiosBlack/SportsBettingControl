import { PrismaClient } from '@prisma/client'
import {
  getDatabaseUrl,
  isPrismaConnectionError,
  sleep,
} from '@/lib/db/connection-url'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbConnectPromise: Promise<void> | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

const MAX_CONNECT_ATTEMPTS = 3

/**
 * Garante conexão ativa com retry (útil para Neon cold start).
 */
export async function ensureDbConnection(): Promise<void> {
  if (globalForPrisma.dbConnectPromise) {
    return globalForPrisma.dbConnectPromise
  }

  globalForPrisma.dbConnectPromise = (async () => {
    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
      try {
        await prisma.$connect()
        return
      } catch (error) {
        lastError = error
        if (!isPrismaConnectionError(error) || attempt === MAX_CONNECT_ATTEMPTS) {
          throw error
        }
        await sleep(1000 * attempt)
      }
    }

    throw lastError
  })()

  try {
    await globalForPrisma.dbConnectPromise
  } catch (error) {
    globalForPrisma.dbConnectPromise = undefined
    throw error
  }
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 2
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await ensureDbConnection()
      return await operation()
    } catch (error) {
      lastError = error
      if (!isPrismaConnectionError(error) || attempt === maxAttempts) {
        throw error
      }
      globalForPrisma.dbConnectPromise = undefined
      await prisma.$disconnect().catch(() => undefined)
      await sleep(1000 * attempt)
    }
  }

  throw lastError
}

export default prisma
