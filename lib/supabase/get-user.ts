import { createClient } from './server'
import { prisma } from '@/lib/prisma'

/**
 * Helper para buscar usuário autenticado do Supabase e seu perfil no banco
 * Retorna tanto o user do Supabase Auth quanto o registro do banco
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  // Buscar perfil do usuário no banco pelo authId
  const dbUser = await prisma.user.findUnique({
    where: { authId: authUser.id },
  })

  if (!dbUser) {
    // Usuário autenticado mas sem perfil no banco
    // Isso pode acontecer se o usuário foi criado no Supabase mas não no banco
    console.error('Usuário autenticado mas sem perfil no banco:', authUser.id)
    return null
  }

  return {
    authUser,
    dbUser,
  }
}

