# 🔧 Correção do Erro de Decimal na Criação de Apostas

## ❌ Problema Identificado

Ao criar apostas, ocorriam erros de serialização:

```
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
{id: ..., userId: ..., bankrollId: ..., sport: ..., event: ..., competition: ..., market: ..., selection: ..., odds: Decimal, stake: ..., status: ..., result: ..., profit: ..., eventDate: ..., placedAt: ..., settledAt: ..., bookmaker: ..., notes: ..., tags: ..., createdAt: ..., updatedAt: ..., bankroll: ...}
                                                                                                                       ^^^^^^^
```

## 🔍 Causa Raiz

O Prisma retorna valores `Decimal` para campos numéricos (`odds`, `stake`, `profit`), mas o Next.js não consegue serializar objetos `Decimal` quando passados de Server Components para Client Components.

## ✅ Solução Aplicada

### **Funções Corrigidas em `lib/actions/bet.ts`:**

1. ✅ **`createBet()`** - Criação de apostas
2. ✅ **`getBets()`** - Listagem de apostas
3. ✅ **`getBetById()`** - Busca por ID
4. ✅ **`updateBet()`** - Atualização de apostas
5. ✅ **`settleBet()`** - Finalização de apostas

### **Padrão de Conversão Aplicado:**

```typescript
// Converter Decimal para number para evitar erro de serialização
const betData = {
  ...bet,
  odds: Number(bet.odds),
  stake: Number(bet.stake),
  profit: bet.profit ? Number(bet.profit) : null,
};

return { success: true, data: betData };
```

### **Exemplo Específico - `createBet()`:**

```typescript
// ANTES (erro de serialização)
return { success: true, data: result };

// DEPOIS (conversão aplicada)
const betData = {
  ...result,
  odds: Number(result.odds),
  stake: Number(result.stake),
  profit: result.profit ? Number(result.profit) : null,
};

return { success: true, data: betData };
```

### **Exemplo Específico - `getBets()` (array):**

```typescript
// ANTES (erro de serialização)
return {
  success: true,
  data: bets,
  pagination: { ... }
}

// DEPOIS (conversão aplicada)
const betsData = bets.map(bet => ({
  ...bet,
  odds: Number(bet.odds),
  stake: Number(bet.stake),
  profit: bet.profit ? Number(bet.profit) : null,
}))

return {
  success: true,
  data: betsData,
  pagination: { ... }
}
```

## 🎯 Resultado

- ✅ **Erro de Decimal resolvido** - Não há mais erros de serialização
- ✅ **Criação de apostas funcionando** - Sem erros no console
- ✅ **Todas as operações de apostas funcionando** - CRUD completo
- ✅ **Performance mantida** - Conversão eficiente
- ✅ **Compatibilidade preservada** - Todos os componentes funcionam

## 🧪 Teste

Para testar a correção:

1. **Acesse**: `/dashboard/bets/new`
2. **Preencha**: Todos os campos obrigatórios
3. **Clique**: "Criar Aposta"
4. **Resultado**: Aposta criada sem erros no console

## 📝 Observações

- **Erro de jQuery**: O erro `jquery-3.4.1.min.js` é de uma extensão do navegador e não afeta o funcionamento da aplicação
- **Conversão segura**: `Number()` converte `Decimal` para `number` de forma segura
- **Campos convertidos**: `odds`, `stake`, `profit` (quando não nulo)
- **Compatibilidade**: Mantém compatibilidade com todos os componentes existentes

## 🔄 Funções Afetadas

| Função       | Descrição            | Status                             |
| ------------ | -------------------- | ---------------------------------- |
| `createBet`  | Criar nova aposta    | ✅ Corrigida                       |
| `getBets`    | Listar apostas       | ✅ Corrigida                       |
| `getBetById` | Buscar aposta por ID | ✅ Corrigida                       |
| `updateBet`  | Atualizar aposta     | ✅ Corrigida                       |
| `settleBet`  | Finalizar aposta     | ✅ Corrigida                       |
| `deleteBet`  | Deletar aposta       | ✅ Não precisa (não retorna dados) |

---

**🎉 Problema resolvido! A criação e manipulação de apostas agora funciona sem erros de serialização.**
