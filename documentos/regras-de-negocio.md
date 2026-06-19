# Regras de Negócio

Este documento descreve as principais lógicas e restrições aplicadas ao sistema Betting Control.

## 1. Gestão de Bancas (Bankrolls)
- **Multi-Banca**: O usuário pode ter múltiplas bancas ativas simultaneamente.
- **Moedas**: Cada banca pode ser configurada com uma moeda específica (Padrão: BRL).
- **Saldo**: O saldo é atualizado dinamicamente com base em transações (Depósito/Saque) e no resultado das apostas (Settlement).
- **Transações**:
  - `DEPOSIT`: Aumenta o saldo atual da banca.
  - `WITHDRAW`: Diminui o saldo atual da banca.

- **Investimento Total (exibição)**: Saldo inicial da banca + soma de transações `DEPOSIT`.
- **Lucro/Prejuízo (exibição)**: Resultado das apostas finalizadas (`Σ profit`), com composição ganhas/perdidas. Não usa diferença de saldo contábil.
- **Apostas pendentes (observação)**: Exibe a soma de `stake` das apostas com status `PENDENTE` como valor em jogo.
- **Resumo na listagem (`/dashboard/bets`)**: Cards com quantidade, valor apostado, saldo (lucro/prejuízo das finalizadas) e pendentes, recalculados conforme período + filtros de status/busca.
- **Resumo do dia na Dashboard (`/dashboard`)**: Cards com valor apostado, saldo do dia e pendentes, sempre filtrados por `eventDate` do dia atual.

## 2. Gestão de Apostas (Bets)
- **Vínculo**: Toda aposta deve estar vinculada a uma Banca (Bankroll) e ao Usuário autenticado.
- **Data do evento (`eventDate`)**: Ao criar ou editar, persiste como meio-dia UTC do dia civil escolhido (`yyyy-MM-ddT12:00:00.000Z`), garantindo consistência entre filtro, listagem e agrupamento.
- **Evento manual**: Evento e competição são informados pelo usuário (campos texto), sem dependência de APIs externas.
- **Estatutos (Status)**:
  - `PENDENTE`: Aposta realizada, aguardando resultado.
  - `GANHA`: Aposta liquidada como vencedora (Soma lucro ao saldo).
  - `PERDIDA`: Aposta liquidada como perdedora (Não altera saldo, pois o valor já foi debitado na criação).
  - `ANULADA`: Valor da stake é devolvido à banca.
  - `CASHOUT`: Valor parcial devolvido/lucrado conforme negociação com a casa.
- **Resultados (Result)**: Refinamento do status para tratar casos como `HALF_WIN` ou `HALF_LOSS`.

## 3. Estatísticas e ROI
- **Lucro/Prejuízo exibido**: Soma do campo `profit` das apostas finalizadas (ganhas − perdidas + cashout/anuladas).
- **ROI (Return on Investment)**: Calculado com base no lucro total dividido pelo valor total apostado em apostas finalizadas (Stake).
- **Win Rate**: Porcentagem de acerto baseada apenas em apostas finalizadas (Win vs Loss).
- **Filtros de Período**: Cálculos executados em tempo real filtrados por Hoje, 7 dias, 30 dias ou Todos.
