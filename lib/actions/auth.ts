'use server'

import { signIn, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { z } from 'zod'

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

    await signIn('credentials', {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: true,
      redirectTo: '/dashboard',
    })

    return { message: 'Login realizado com sucesso!' }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Credenciais inválidas.' }
        default:
          return { message: 'Erro ao fazer login. Tente novamente.' }
      }
    }
    throw error
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

    // Verificar se o usuário já existe
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

    // Criar usuário
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
    await signIn('credentials', {
      email,
      password,
      redirect: true,
      redirectTo: '/dashboard',
    })

    return { message: 'Conta criada com sucesso!' }
  } catch (error) {
    return {
      message: 'Erro ao criar conta. Tente novamente.',
    }
  }
}

// Action de Logout
export async function logout() {
  await signOut({ redirectTo: '/login' })
}

// Action de Login com Google
export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' })
}

