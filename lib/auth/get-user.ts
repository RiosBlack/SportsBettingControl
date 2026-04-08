import { cache } from 'react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * Helper para buscar usuário autenticado do NextAuth e seu perfil no banco
 * Retorna o usuário do banco de dados
 * Memoizado com React cache para evitar múltiplas queries no banco na mesma requisição
 */
export const getCurrentUser = cache(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  // Buscar perfil do usuário no banco
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!dbUser) {
    return null
  }

  return {
    dbUser,
  }
})

