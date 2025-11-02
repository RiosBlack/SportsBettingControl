# ⌨️ Digitação Manual no Campo Evento

## ✅ Implementado

### Funcionalidade
O campo "Evento" agora permite **digitação manual livre** além de selecionar jogos da lista. O usuário pode digitar qualquer texto se não encontrar o jogo desejado.

## 🎯 Comportamentos

### 1. Selecionar da Lista
```
Usuário clica no campo → Abre dropdown
Usuário digita "Flamengo" → Filtra jogos
Usuário clica em "CR Flamengo x SC Recife"
✅ Evento: "CR Flamengo x SC Recife"
✅ Competição: "Campeonato Brasileiro Série A" (automático)
```

### 2. Digitar Manualmente
```
Usuário clica no campo → Abre dropdown
Usuário digita "Meu Time x Outro Time"
Usuário continua digitando livremente
✅ Evento: "Meu Time x Outro Time"
✅ Competição: "" (vazio - usuário preenche)
```

### 3. Não Encontrou o Jogo
```
Usuário busca "Time Pequeno"
Dropdown mostra: "Nenhum jogo encontrado"
Usuário continua digitando: "Time Pequeno x Time Local"
✅ Evento: "Time Pequeno x Time Local"
✅ Competição: "" (usuário preenche manualmente)
```

## 🔧 Implementação

### 1. MatchCombobox Modificado
**Arquivo**: `components/match-combobox.tsx`

#### Mudanças Principais:

**Antes**: Button (somente seleção)
```typescript
<Button variant="outline" role="combobox">
  {value || "Ex: Flamengo x Palmeiras"}
</Button>
```

**Depois**: Input (digitação + seleção)
```typescript
<Input
  value={inputValue}
  onChange={(e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    // Limpar competição quando digitar manualmente
    if (onCompetitionChange) {
      onCompetitionChange("");
    }
  }}
  onFocus={() => setOpen(true)}
  placeholder="Ex: Flamengo x Palmeiras"
/>
```

### 2. Novo Callback
Adicionado `onCompetitionChange` para controlar o preenchimento:

```typescript
interface MatchComboboxProps {
  matches: Match[];
  value: string;
  onChange: (value: string) => void;
  onCompetitionChange?: (competition: string) => void; // ✨ Novo
  disabled?: boolean;
}
```

### 3. Lógica de Preenchimento

**Ao selecionar da lista**:
```typescript
onSelect={() => {
  onChange(matchText);
  setInputValue(matchText);
  if (onCompetitionChange) {
    onCompetitionChange(match.competition); // ✅ Preenche
  }
  setOpen(false);
}}
```

**Ao digitar manualmente**:
```typescript
onChange={(e) => {
  setInputValue(e.target.value);
  onChange(e.target.value);
  if (onCompetitionChange) {
    onCompetitionChange(""); // ✅ Limpa
  }
}}
```

## 🎨 UI/UX

### Visual
```
┌─────────────────────────────────────────┐
│ Flamengo x Palmeiras              [▼]  │ ← Input editável
└─────────────────────────────────────────┘
         ↓ (ao clicar ou focar)
┌─────────────────────────────────────────┐
│ 🔍 Buscar time...                       │
├─────────────────────────────────────────┤
│ [🔴] CR Flamengo x [⚫] SC Recife       │
│      Brasileirão Série A        21:00   │
├─────────────────────────────────────────┤
│ Nenhum jogo encontrado.                 │
└─────────────────────────────────────────┘
```

### Interações

1. **Clicar no campo**: Abre dropdown com jogos
2. **Digitar**: Filtra jogos OU escreve livremente
3. **Clicar no ícone ▼**: Abre/fecha dropdown
4. **Selecionar jogo**: Preenche evento + competição
5. **Continuar digitando**: Mantém texto livre

## ✨ Vantagens

### Para o Usuário
- ✅ **Flexibilidade**: Pode digitar qualquer evento
- ✅ **Rapidez**: Não precisa procurar se souber o nome
- ✅ **Sugestões**: Ainda tem autocomplete quando disponível
- ✅ **Sem bloqueios**: Nunca fica preso sem poder criar aposta

### Para o Sistema
- ✅ **Fallback robusto**: Funciona mesmo sem API
- ✅ **Compatibilidade**: Aceita qualquer formato de evento
- ✅ **UX consistente**: Input familiar para o usuário

## 🔄 Fluxos de Uso

### Fluxo 1: Jogo na Lista
```
1. Usuário abre campo
2. Vê jogo desejado
3. Clica no jogo
4. ✅ Evento e Competição preenchidos
```

### Fluxo 2: Jogo Não Listado
```
1. Usuário abre campo
2. Busca mas não encontra
3. Digita manualmente: "Time A x Time B"
4. ✅ Evento preenchido manualmente
5. Preenche Competição manualmente
```

### Fluxo 3: Digitação Direta
```
1. Usuário clica no campo
2. Ignora dropdown
3. Digita diretamente: "Amistoso Local"
4. ✅ Evento preenchido
5. Preenche outros campos
```

## 🧪 Testando

### Teste 1: Seleção da Lista
1. Acesse `/dashboard/bets/new`
2. Clique em "Evento"
3. Digite "Flamengo"
4. Clique em um jogo da lista
5. ✅ Deve preencher evento e competição

### Teste 2: Digitação Manual
1. Acesse `/dashboard/bets/new`
2. Clique em "Evento"
3. Digite "Meu Time x Outro Time"
4. Continue digitando livremente
5. ✅ Deve aceitar o texto digitado
6. ✅ Competição deve ficar vazia

### Teste 3: Alternar Entre Modos
1. Digite manualmente: "Teste"
2. Apague e selecione da lista
3. ✅ Deve preencher competição
4. Apague e digite novamente
5. ✅ Deve limpar competição

## 📊 Comparação

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Entrada** | Somente seleção | Seleção + Digitação |
| **Flexibilidade** | Limitado a jogos da API | Qualquer texto |
| **Competição** | Manual sempre | Automática ao selecionar |
| **UX** | Button (clique) | Input (digitação) |
| **Fallback** | Input separado | Mesmo componente |

## 🎯 Casos de Uso

### ✅ Cobertos Agora
- Jogos da API Football Data
- Jogos não listados na API
- Eventos personalizados
- Amistosos locais
- Competições regionais
- Jogos de esportes não suportados pela API

### Exemplos Reais
```
✅ "Flamengo x Palmeiras" (da API)
✅ "Time Local x Visitante" (manual)
✅ "Amistoso - Teste x Prova" (manual)
✅ "Torneio Interno - A x B" (manual)
✅ "Jogo Beneficente" (manual)
```

## 💡 Melhorias Futuras

- [ ] Salvar eventos digitados manualmente para sugestões futuras
- [ ] Histórico de eventos mais usados
- [ ] Sugestão de formato (ex: "Time A x Time B")
- [ ] Validação de formato (opcional)
- [ ] Autocomplete de times já usados anteriormente

---

**🎉 Campo "Evento" agora aceita digitação manual livre!**

