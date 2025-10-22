import { z } from 'zod'

export const CreateBankrollSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  initialBalance: z.coerce
    .number({ required_error: 'Saldo inicial é obrigatório' })
    .positive('Saldo deve ser maior que zero')
    .max(1000000000, 'Valor muito alto'),
  currency: z.string().default('BRL'),
})

export const UpdateBankrollSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  isActive: z.boolean().optional(),
})

export const UpdateBankrollBalanceSchema = z.object({
  id: z.string(),
  amount: z.coerce
    .number({ required_error: 'Valor é obrigatório' })
    .refine((val) => val !== 0, 'Valor não pode ser zero'),
  operation: z.enum(['add', 'subtract', 'set']),
})

export type CreateBankrollInput = z.infer<typeof CreateBankrollSchema>
export type UpdateBankrollInput = z.infer<typeof UpdateBankrollSchema>
export type UpdateBankrollBalanceInput = z.infer<typeof UpdateBankrollBalanceSchema>

