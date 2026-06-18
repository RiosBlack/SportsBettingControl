# Funções e Server Actions

A lógica de backend do Betting Control é centralizada em **Server Actions**, permitindo uma comunicação tipada entre Frontend e Backend sem a necessidade de APIs REST manuais.

## 1. Módulo de Autenticação (`auth.ts`)
- `registerUser`: Criação de novo usuário com hash de senha.
- `loginUser`: (Gerenciado via `signIn` do NextAuth).

## 2. Módulo de Bancas (`bankroll.ts`)
- `createBankroll`: Inicializa uma nova banca com saldo inicial.
- `updateBankroll`: Atualiza dados como nome ou status de atividade.
- `deleteBankroll`: Remove permanentemente uma banca (Cascade bets).
- `getBankrolls`: Recupera as bancas do usuário logado.

## 3. Módulo de Transações (`transaction.ts`)
- `addTransaction`: Registra depósitos (`DEPOSIT`) ou saques (`WITHDRAW`).
- `getBankrollTransactions`: Lista histórico financeiro de uma banca específica.

## 4. Módulo de Apostas (`bet.ts`)
- `createBet`: Registra uma nova aposta, valida o saldo e debita a stake da banca vinculada.
- `updateBet`: Permite editar detalhes da aposta.
- `deleteBet`: Remove o registro e estorna o saldo se necessário (regra customizável).
- `settleBet`: Finaliza uma aposta (`WIN`, `LOSS`, `VOID`, etc.) e processa o lucro/prejuízo no saldo da banca.

## 5. Módulo de Mercados (`market.ts`)
- `createMarket`: Cadastra novo mercado de aposta.
- `getMarkets`: Lista mercados disponíveis.

## 6. Módulo de Estatísticas (`stats.ts`)
- `getUserStats`: Calcula ROI, Win Rate e Profit Global.
- `getStatsByDateRange`: Agrupamentos por período para gráficos (Recharts).
- `getBankrollStats`: Estatísticas por banca.
