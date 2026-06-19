export const BOOKMAKER_OPTIONS = [
  { value: 'Bet365', label: 'Bet365', color: '#005340' },
  { value: 'Superbet', label: 'Superbet', color: '#E80105' },
  { value: 'Betano', label: 'Betano', color: '#FF3D00' },
  { value: 'BetMGM', label: 'BetMGM', color: '#B19661' },
  { value: 'Outros', label: 'Outros', color: undefined },
] as const

export type BookmakerValue = (typeof BOOKMAKER_OPTIONS)[number]['value']
