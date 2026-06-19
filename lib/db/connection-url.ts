const DEFAULT_CONNECT_TIMEOUT = '30'

/**
 * Normaliza DATABASE_URL para Neon/pooler: SSL, timeout e pgbouncer quando necessário.
 */
export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')

  if (!raw) {
    throw new Error(
      'DATABASE_URL não configurada. Defina no .env (local ou Neon).'
    )
  }

  if (!raw.startsWith('postgresql://') && !raw.startsWith('postgres://')) {
    throw new Error(
      'DATABASE_URL inválida: deve começar com postgresql:// ou postgres://'
    )
  }

  const url = new URL(raw)

  if (!url.searchParams.has('sslmode') && url.hostname.includes('neon.tech')) {
    url.searchParams.set('sslmode', 'require')
  }

  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', DEFAULT_CONNECT_TIMEOUT)
  }

  if (
    url.hostname.includes('-pooler') &&
    !url.searchParams.has('pgbouncer')
  ) {
    url.searchParams.set('pgbouncer', 'true')
  }

  return url.toString()
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const code = 'code' in error ? String(error.code) : ''
  if (code === 'P1001' || code === 'P1002' || code === 'P1008' || code === 'P1017') {
    return true
  }

  const message = 'message' in error ? String(error.message) : String(error)
  return (
    message.includes("Can't reach database server") ||
    message.includes('Connection terminated') ||
    message.includes('Connection timed out') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT')
  )
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
