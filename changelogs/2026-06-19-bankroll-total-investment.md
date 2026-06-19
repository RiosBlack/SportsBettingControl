# Investimento Total: saldo inicial + depósitos

## Contexto
O card "Investimento Total" na página de bancas considerava apenas a soma dos saldos iniciais, ignorando depósitos posteriores.

## Alterações
- `app/dashboard/bankrolls/page.tsx`: investimento total = saldo inicial + soma de transações `DEPOSIT`; lucro/prejuízo recalculado com base nesse valor.
- `app/dashboard/bankrolls/_components/bankrolls-list.tsx`: cards por banca usam o mesmo critério (investimento, lucro/prejuízo e barra de progresso).

## Fórmula
```
Investimento Total = Σ initialBalance + Σ depósitos (type DEPOSIT)
Lucro/Prejuízo = Saldo Atual - Investimento Total
```
