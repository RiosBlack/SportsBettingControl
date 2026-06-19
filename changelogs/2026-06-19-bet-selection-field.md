# Campo Seleção no Formulário de Aposta

**Data:** 2026-06-19

## Resumo

Reintroduzido o campo **Seleção** no formulário manual de Nova Aposta e no diálogo de edição de apostas pendentes.

## Alterações

- `create-bet-form.tsx`: campo de texto abaixo de Mercado, persistido em `Bet.selection`.
- `edit-bet-dialog.tsx`: mesmo campo para edição de apostas pendentes.

## Motivação

Alinhar o preenchimento manual com a importação por print (ex.: mercado "Jogador - Chutes", seleção "Folarin Balogun - Mais de 3.5") e com a exibição na listagem de apostas.
