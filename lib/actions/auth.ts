'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { syncTodayMatches } from './matches'

// Schemas de validação
const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

const RegisterSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

// Action de Login
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const validatedFields = LoginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Campos inválidos. Verifique os dados informados.',
      }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
    })

    if (error) {
      return {
        message: 'Credenciais inválidas.',
      }
    }

    // Sincronizar jogos do dia em background (não bloqueia o login)
    syncTodayMatches().catch((error) => {
      console.error('Erro ao sincronizar jogos:', error)
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    // Redirect throws an error, so we need to catch it
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    return {
      message: 'Erro ao fazer login. Tente novamente.',
    }
  }
}

// Action de Registro
export async function register(
  prevState: any,
  formData: FormData
) {
  try {
    const validatedFields = RegisterSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Campos inválidos. Verifique os dados informados.',
      }
    }

    const { name, email, password } = validatedFields.data

    const supabase = await createClient()

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return {
          message: 'Este email já está em uso.',
        }
      }
      return {
        message: authError.message || 'Erro ao criar conta.',
      }
    }

    if (!authData.user) {
      return {
        message: 'Erro ao criar conta. Tente novamente.',
      }
    }

    // Criar perfil do usuário no banco
    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        name,
        email,
      },
    })

    // Criar banca padrão para o usuário
    await prisma.bankroll.create({
      data: {
        userId: user.id,
        name: 'Banca Principal',
        initialBalance: 0,
        currentBalance: 0,
      },
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    // Redirect throws an error, so we need to catch it
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    return {
      message: 'Erro ao criar conta. Tente novamente.',
    }
  }
}

// Action de Logout
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

