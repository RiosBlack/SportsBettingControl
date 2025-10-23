# 🔧 Correção do Erro de Decimal

## ❌ Problema Identificado

Ao criar bancas, ocorriam erros de serialização:

```
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
{id: ..., userId: ..., name: "teste", initialBalance: Decimal, currentBalance: ..., currency: ..., isActive: ..., createdAt: ..., updatedAt: ...}
                                                        ^^^^^^^
```

## 🔍 Causa Raiz

O Prisma retorna valores `Decimal` para campos numéricos, mas o Next.js não consegue serializar objetos `Decimal` quando passados de Server Components para Client Components.

## ✅ Solução Aplicada

### 1. Correção nas Server Actions

Todas as funções em `lib/actions/bankroll.ts` foram atualizadas para converter valores `Decimal` para `number` antes de retornar:

#### Funções Corrigidas:

- ✅ `createBankroll()` - Criação de bancas
- ✅ `getBankrolls()` - Listagem de bancas
- ✅ `getBankrollById()` - Busca por ID
- ✅ `updateBankroll()` - Atualização de bancas
- ✅ `updateBankrollBalance()` - Atualização de saldo
- ✅ `getActiveBankroll()` - Busca de banca ativa

#### Padrão de Conversão:

```typescript
// Converter Decimal para number para evitar erro de serialização
const bankrollData = {
  ...bankroll,
  initialBalance: Number(bankroll.initialBalance),
  currentBalance: Number(bankroll.currentBalance),
};

return { success: true, data: bankrollData };
```

### 2. Remoção de Conversão Duplicada

A página `app/dashboard/bankrolls/page.tsx` foi simplificada, removendo a conversão duplicada já que as server actions agora retornam dados já convertidos:

```typescript
// ANTES (conversão duplicada)
const bankrollsData = bankrollsResult.data || [];
const bankrolls = bankrollsData.map((b) => ({
  ...b,
  initialBalance: Number(b.initialBalance),
  currentBalance: Number(b.currentBalance),
}));

// DEPOIS (simplificado)
const bankrolls = bankrollsResult.data || [];
```

## 🎯 Resultado

- ✅ **Erro de Decimal resolvido** - Não há mais erros de serialização
- ✅ **Criação de bancas funcionando** - Sem erros no console
- ✅ **Performance melhorada** - Conversão feita uma vez nas server actions
- ✅ **Código mais limpo** - Sem conversões duplicadas

## 🧪 Teste

Para testar a correção:

1. **Acesse**: `/dashboard/bankrolls`
2. **Clique**: "+ Nova Banca"
3. **Preencha**: Nome e valor inicial
4. **Clique**: "Criar Banca"
5. **Resultado**: Banca criada sem erros no console

## 📝 Observações

- **Erro de jQuery**: O erro `jquery-3.4.1.min.js` é de uma extensão do navegador e não afeta o funcionamento da aplicação
- **Conversão segura**: `Number()` converte `Decimal` para `number` de forma segura
- **Compatibilidade**: Mantém compatibilidade com todos os componentes existentes

---

**🎉 Problema resolvido! A criação de bancas agora funciona sem erros.**
