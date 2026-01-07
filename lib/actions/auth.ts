'use server'

import { signIn, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
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

    const { email, password } = validatedFields.data

    // Tentar fazer login com NextAuth
    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
    } catch (error: any) {
      // NextAuth v5 lança erro se as credenciais forem inválidas
      if (error?.cause?.err?.message === 'CredentialsSignin') {
        return {
          message: 'Credenciais inválidas.',
        }
      }
      return {
        message: 'Credenciais inválidas.',
      }
    }

    // Sincronizar jogos do dia em background (não bloqueia o login)
    syncTodayMatches().catch(() => {
      // Erro silencioso - não bloqueia o login
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

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        message: 'Este email já está em uso.',
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário no banco
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
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

    // Fazer login automático após registro
    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
    } catch (error) {
      // Se o login falhar, redireciona mesmo assim (usuário foi criado)
    }

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
  await signOut({ redirectTo: '/login' })
  revalidatePath('/', 'layout')
}
