# Funções e Server Actions

A lógica de backend do RiosBlack é centralizada em **Server Actions**, permitindo uma comunicação tipada entre Frontend e Backend sem a necessidade de APIs REST manuais.

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

## 5. Módulo de Fixtures (`fixtures.ts`)
- `syncDailyFixtures`: Orquestra a busca na API-Football e o salvamento em lote no banco local.
- `getMatchesByDate`: Filtra jogos armazenados por data e esporte.

## 6. Módulo de Estatísticas (`stats.ts`)
- `getGlobalStats`: Calcula ROI, Win Rate e Profit Global.
- `getPeriodStats`: Agrupamentos por dia/semana/mês para gráficos (Recharts).

## 7. Módulo de Favoritos (`favorites.ts`)
- `toggleFavoriteLeague`: Adiciona/Remove liga dos favoritos.
- `toggleFavoriteTeam`: Adiciona/Remove time dos favoritos.
