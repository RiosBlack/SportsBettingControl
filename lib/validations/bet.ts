import { z } from 'zod'

export const SportEnum = z.enum([
  'FUTEBOL',
  'BASQUETE',
  'TENIS',
  'VOLEI',
  'FUTSAL',
  'HANDEBOL',
  'BASEBALL',
  'FUTEBOL_AMERICANO',
  'HOCKEY',
  'MMA',
  'BOXE',
  'ESPORTS',
  'OUTROS',
])

export const BetStatusEnum = z.enum([
  'PENDENTE',
  'GANHA',
  'PERDIDA',
  'ANULADA',
  'CASHOUT',
])

export const BetResultEnum = z.enum([
  'WIN',
  'LOSS',
  'VOID',
  'HALF_WIN',
  'HALF_LOSS',
])

export const CreateBetSchema = z.object({
  bankrollId: z.string({ required_error: 'Banca é obrigatória' }),
  sport: SportEnum.default('FUTEBOL'),
  event: z.string().min(3, 'Nome do evento deve ter no mínimo 3 caracteres'),
  competition: z.string().optional(),
  market: z.string().min(3, 'Mercado é obrigatório'),
  selection: z.string().min(1, 'Seleção é obrigatória'),
  odds: z.coerce
    .number({ required_error: 'Cotação é obrigatória' })
    .positive('Cotação deve ser maior que zero')
    .min(1.01, 'Cotação deve ser no mínimo 1.01')
    .max(1000, 'Cotação muito alta'),
  stake: z.coerce
    .number({ required_error: 'Valor apostado é obrigatório' })
    .positive('Valor deve ser maior que zero')
    .max(1000000, 'Valor muito alto'),
  eventDate: z.coerce.date({ required_error: 'Data do evento é obrigatória' }),
  bookmaker: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export const UpdateBetSchema = z.object({
  id: z.string(),
  sport: SportEnum.optional(),
  event: z.string().min(3).optional(),
  competition: z.string().optional(),
  market: z.string().min(3).optional(),
  selection: z.string().min(1).optional(),
  odds: z.coerce.number().positive().min(1.01).max(1000).optional(),
  stake: z.coerce.number().positive().max(1000000).optional(),
  eventDate: z.coerce.date().optional(),
  bookmaker: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const SettleBetSchema = z.object({
  id: z.string(),
  status: BetStatusEnum,
  result: BetResultEnum.optional(),
})

export const FilterBetsSchema = z.object({
  bankrollId: z.string().optional(),
  sport: SportEnum.optional(),
  status: BetStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export type CreateBetInput = z.infer<typeof CreateBetSchema>
export type UpdateBetInput = z.infer<typeof UpdateBetSchema>
export type SettleBetInput = z.infer<typeof SettleBetSchema>
export type FilterBetsInput = z.infer<typeof FilterBetsSchema>

