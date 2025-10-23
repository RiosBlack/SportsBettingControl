# 📈 Implementação do Gráfico de Linha - Desempenho por Período

## ✅ Modificações Realizadas

### 1. **Instalação da Biblioteca de Gráficos**

- ✅ Instalado `recharts` para criação de gráficos interativos
- ✅ Biblioteca compatível com React e Next.js

### 2. **Atualização da Server Action**

**Arquivo**: `lib/actions/stats.ts`

#### **Modificações:**

- ✅ Adicionado campo `settledAt` na busca de apostas
- ✅ Implementado cálculo de lucro/prejuízo diário
- ✅ Inicialização de todos os dias do período com valor 0
- ✅ Agregação de lucros por data de liquidação
- ✅ Retorno de array `dailyProfits` ordenado por data

#### **Lógica do Cálculo Diário:**

```typescript
// Inicializar todos os dias do período com 0
const currentDate = new Date(startDate);
while (currentDate <= endDate) {
  const dateKey = currentDate.toISOString().split("T")[0];
  dailyProfitsMap.set(dateKey, 0);
  currentDate.setDate(currentDate.getDate() + 1);
}

// Adicionar lucros das apostas
bets.forEach((bet) => {
  if (bet.settledAt) {
    const dateKey = bet.settledAt.toISOString().split("T")[0];
    const currentProfit = dailyProfitsMap.get(dateKey) || 0;
    dailyProfitsMap.set(dateKey, currentProfit + Number(bet.profit || 0));
  }
});
```

### 3. **Atualização do Componente**

**Arquivo**: `app/dashboard/_components/period-stats-card.tsx`

#### **Novos Imports:**

- ✅ `ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip` do recharts

#### **Interface Atualizada:**

- ✅ Adicionado campo `dailyProfits: { date: string; profit: number }[]`

#### **Layout Reformulado:**

- ✅ **Antes**: 4 cards (Lucro/Prejuízo, Apostas, Win Rate, ROI)
- ✅ **Depois**: 2 cards de resumo + gráfico de linha

#### **Cards de Resumo:**

1. **Lucro/Prejuízo Total**: Valor total com ROI
2. **Apostas Finalizadas**: Quantidade com breakdown ganhas/perdidas

#### **Gráfico de Linha:**

- ✅ **Altura**: 300px responsiva
- ✅ **Eixo X**: Datas formatadas (dd/MM)
- ✅ **Eixo Y**: Valores monetários em reais
- ✅ **Linha**: Cor primária do tema, espessura 2px
- ✅ **Pontos**: Círculos de 4px, pontos ativos de 6px
- ✅ **Grid**: Linhas pontilhadas com cor muted
- ✅ **Tooltip**: Customizado com data e valor formatados

#### **Tooltip Customizado:**

```typescript
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <div className="grid gap-2">
          <p className="text-sm font-medium">
            {format(new Date(label), "dd/MM/yyyy", { locale: ptBR })}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Lucro/Prejuízo:
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                payload[0].value > 0
                  ? "text-green-600"
                  : payload[0].value < 0
                  ? "text-red-600"
                  : "text-gray-500"
              )}
            >
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
```

## 🎯 Funcionalidades do Gráfico

### **Visualização:**

- ✅ **Linha contínua** mostrando evolução diária
- ✅ **Pontos interativos** para cada dia com dados
- ✅ **Hover effect** com tooltip informativo
- ✅ **Cores condicionais** no tooltip (verde/vermelho/cinza)

### **Responsividade:**

- ✅ **Desktop**: Gráfico em tela cheia
- ✅ **Mobile**: Adaptação automática do tamanho
- ✅ **Tablet**: Layout otimizado

### **Formatação:**

- ✅ **Datas**: Formato brasileiro (dd/MM/yyyy)
- ✅ **Valores**: Formato monetário brasileiro (R$)
- ✅ **Eixos**: Estilo consistente com o tema

## 📊 Exemplo de Uso

```
Período: 01/12/2024 - 31/12/2024

┌─────────────────────────────────────────────────────────┐
│  Desempenho por Período                                │
├─────────────────────────────────────────────────────────┤
│  [Data Inicial: 01/12/2024] [Data Final: 31/12/2024]  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Lucro/Prejuízo  │  │ Apostas         │              │
│  │ Total           │  │ Finalizadas     │              │
│  │ +R$ 1.250,00    │  │ 15              │              │
│  │ +12.5% ROI      │  │ 10 ganhas, 5    │              │
│  │                 │  │ perdidas        │              │
│  └─────────────────┘  └─────────────────┘              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     📈 Gráfico de Linha (300px altura)                 │
│                                                         │
│      R$ 500 ┤                                           │
│             │     ●                                     │
│      R$ 250 ┤   ●   ●                                   │
│             │ ●       ●                                 │
│      R$   0 ┼─────────────●                             │
│             │             ●                             │
│   -R$ 250 ┤               ●                             │
│             │               ●                           │
│             └─────────────────────────────────────────  │
│             01/12  05/12  10/12  15/12  20/12  25/12   │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Benefícios da Implementação

1. **Visualização Clara**: Evolução diária do desempenho
2. **Interatividade**: Tooltip com informações detalhadas
3. **Responsividade**: Adaptação a diferentes telas
4. **Consistência**: Design alinhado com o tema da aplicação
5. **Performance**: Renderização otimizada com recharts

---

**🎉 Gráfico de linha implementado com sucesso! O componente agora mostra a evolução diária do lucro/prejuízo de forma visual e interativa.**
