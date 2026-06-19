# Lucro/Prejuízo baseado em apostas + observação de pendentes

## Contexto
O Lucro/Prejuízo exibido nas bancas usava diferença de saldo contábil (`currentBalance − investimento`), misturando depósitos, saques e stakes pendentes.

## Alterações
- `lib/actions/stats.ts`: `getBetProfitSummaries()` agrega lucro por status (ganhas, perdidas, outros) e stakes pendentes; `getUserStats` estendido com `wonProfit`, `lostProfit`, `otherProfit`, `pendingStake`.
- `app/dashboard/_components/bet-profit-loss-summary.tsx`: componente reutilizável com composição ganhas/perdidas e nota de pendentes.
- `app/dashboard/bankrolls/page.tsx` e `bankrolls-list.tsx`: Lucro/Prejuízo baseado em apostas finalizadas.
- `app/dashboard/page.tsx`: card ROI e seção Minhas Bancas alinhados ao mesmo critério.

## Fórmulas
```
Lucro/Prejuízo = Σ profit (apostas finalizadas)
Ganhas = Σ profit onde status = GANHA
Perdidas = Σ profit onde status = PERDIDA
Pendentes (observação) = Σ stake onde status = PENDENTE
Percentual = (Lucro/Prejuízo / Investimento Total) × 100
```
