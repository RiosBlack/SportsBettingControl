# Regras de Negócio

Este documento descreve as principais lógicas e restrições aplicadas ao sistema RiosBlack Sports Betting Control.

## 1. Gestão de Bancas (Bankrolls)
- **Multi-Banca**: O usuário pode ter múltiplas bancas ativas simultaneamente.
- **Moedas**: Cada banca pode ser configurada com uma moeda específica (Padrão: BRL).
- **Saldo**: O saldo é atualizado dinamicamente com base em transações (Depósito/Saque) e no resultado das apostas (Settlement).
- **Transações**:
  - `DEPOSIT`: Aumenta o saldo atual da banca.
  - `WITHDRAW`: Diminui o saldo atual da banca.

## 2. Gestão de Apostas (Bets)
- **Vínculo**: Toda aposta deve estar vinculada a uma Banca (Bankroll) e ao Usuário autenticado.
- **Estatutos (Status)**:
  - `PENDENTE`: Aposta realizada, aguardando resultado.
  - `GANHA`: Aposta liquidada como vencedora (Soma lucro ao saldo).
  - `PERDIDA`: Aposta liquidada como perdedora (Não altera saldo, pois o valor já foi debitado na criação).
  - `ANULADA`: Valor da stake é devolvido à banca.
  - `CASHOUT`: Valor parcial devolvido/lucrado conforme negociação com a casa.
- **Resultados (Result)**: Refinamento do status para tratar casos como `HALF_WIN` ou `HALF_LOSS`.

## 3. Sincronização de Fixtures (API-Football)
- **Sincronização Diária**: O sistema consome dados da API-Football (v3).
- **Entidades de Terceiros**: Teams, Leagues e Matches são persistidos no banco local para evitar chamadas excessivas e garantir a integridade histórica.
- **Atualização de Resultados**: Processos agendados/manuais para atualizar placares e liquidar apostas vinculadas a matches.

## 4. Estatísticas e ROI
- **ROI (Return on Investment)**: Calculado com base no lucro total dividido pelo valor total investido (Stake).
- **Win Rate**: Porcentagem de acerto baseada apenas em apostas finalizadas (Win vs Loss).
- **Filtros de Período**: Cálculos executados em tempo real filtrados por Hoje, 7 dias, 30 dias ou Todos.

## 5. Favoritos
- Usuários podem favoritar Times e Ligas para acesso rápido e filtragem facilitada na listagem de jogos (Fixtures).
