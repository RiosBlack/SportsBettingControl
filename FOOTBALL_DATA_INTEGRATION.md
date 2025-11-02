# ⚽ Integração Football Data API

## ✅ Implementação Concluída

### Sistema de Autocomplete de Jogos do Dia

Implementado sistema completo que busca automaticamente os jogos do dia da Football Data API ao fazer login, armazena localmente com renovação diária, e fornece autocomplete inteligente no formulário de apostas.

## 📁 Arquivos Criados

### 1. Types
**Arquivo**: `lib/types/matches.ts`
- `Match`: Interface para jogos formatados
- `MatchesData`: Estrutura do arquivo JSON local
- `FootballDataMatch`: Tipo da resposta da API
- `FootballDataResponse`: Wrapper da resposta

### 2. API Route
**Arquivo**: `app/api/matches/today/route.ts`
- Endpoint GET `/api/matches/today`
- Busca jogos do dia da Football Data API
- Formata dados: confronto, logos, horário, competição
- Cache de 24 horas (ISR)
- Tratamento de erros robusto

### 3. Server Actions
**Arquivo**: `lib/actions/matches.ts`
- `syncTodayMatches()`: Sincroniza jogos da API e salva em arquivo
- `getTodayMatches()`: Lê jogos do arquivo local com validação de data
- `searchMatchesByTeam()`: Busca jogos por nome do time
- Cria diretório `public/data/` automaticamente
- Verifica se dados são de hoje antes de retornar

### 4. Componente MatchCombobox
**Arquivo**: `components/match-combobox.tsx`
- Combobox com busca de times
- Exibe logos dos times (home e away)
- Mostra competição e horário
- Filtragem ao digitar
- Formato: "Time A x Time B"

### 5. Integração no Formulário
**Arquivo**: `app/dashboard/bets/new/_components/create-bet-form.tsx`
- Campo "Evento" substituído por MatchCombobox
- Fallback para Input manual se não houver jogos
- State management com useState
- Hidden input para form submission

### 6. Busca de Jogos na Página
**Arquivo**: `app/dashboard/bets/new/page.tsx`
- Busca paralela de bankrolls e matches
- Passa matches como prop para o formulário

### 7. Sincronização no Login
**Arquivo**: `lib/actions/auth.ts`
- Chama `syncTodayMatches()` após login bem-sucedido
- Execução em background (não bloqueia login)
- Try-catch para não quebrar se API falhar

## 🔧 Configuração Necessária

### Variável de Ambiente
Adicionar ao arquivo `.env`:
```env
FOOTBALL_DATA_API_KEY=9a8afc131caf4bbb8a00a1645d635109
```

**Nota**: A chave já está configurada no plano. Para produção, obter nova chave em https://www.football-data.org/

## 🎯 Fluxo de Funcionamento

### 1. Login
```
Usuário faz login
  ↓
authenticate() executa
  ↓
syncTodayMatches() em background
  ↓
Busca API → Salva JSON → Não bloqueia
```

### 2. Criar Aposta
```
Acessa /dashboard/bets/new
  ↓
getTodayMatches() carrega dados
  ↓
Verifica se arquivo existe e é de hoje
  ↓
Se não, sincroniza automaticamente
  ↓
Popula MatchCombobox
```

### 3. Autocomplete
```
Usuário digita nome do time
  ↓
Command filtra matches
  ↓
Exibe: Logo + Time A x Time B + Competição + Horário
  ↓
Seleciona → Preenche campo
```

## 📊 Estrutura de Dados

### Arquivo JSON Local
**Path**: `public/data/matches-today.json`

```json
{
  "date": "2025-11-02",
  "lastUpdated": "2025-11-02T14:30:00.000Z",
  "matches": [
    {
      "id": "123456",
      "homeTeam": "Flamengo",
      "awayTeam": "Palmeiras",
      "homeLogo": "https://crests.football-data.org/123.png",
      "awayLogo": "https://crests.football-data.org/456.png",
      "competition": "Brasileirão Série A",
      "time": "16:00",
      "utcDate": "2025-11-02T19:00:00Z"
    }
  ]
}
```

## 🔄 Cache e Renovação

### Estratégia de Cache
1. **Arquivo JSON**: Armazenado em `public/data/`
2. **Validação de Data**: Verifica se `data === hoje`
3. **Renovação Automática**: Se data diferente, faz nova request
4. **ISR no Next.js**: Cache de 24h na API route

### Quando Sincroniza
- ✅ Ao fazer login
- ✅ Ao acessar formulário se arquivo não existe
- ✅ Ao acessar formulário se arquivo é de ontem
- ❌ NÃO sincroniza múltiplas vezes no mesmo dia

## 🎨 UI/UX

### MatchCombobox
- **Busca**: Digite nome do time para filtrar
- **Visual**: Logos dos times + nomes + competição + horário
- **Seleção**: Click seleciona e preenche campo
- **Fallback**: Se sem jogos, mostra Input normal

### Exemplo Visual
```
┌─────────────────────────────────────────────┐
│ 🔍 Buscar time...                           │
├─────────────────────────────────────────────┤
│ [🔴] Flamengo x [🟢] Palmeiras              │
│      Brasileirão Série A          16:00     │
├─────────────────────────────────────────────┤
│ [⚪] Real Madrid x [🔵] Barcelona           │
│      La Liga                      21:00     │
└─────────────────────────────────────────────┘
```

## 🚨 Tratamento de Erros

### Fallbacks Implementados
1. **API falha**: Campo continua como Input normal
2. **Arquivo não existe**: Tenta sincronizar automaticamente
3. **Sem jogos hoje**: Mostra Input manual
4. **Erro no login**: Não quebra autenticação

### Logs
- Erros logados no console (server-side)
- Não expõe erros ao usuário
- Funcionalidade principal nunca é bloqueada

## 📡 API Football Data

### Endpoint Usado
```
GET https://api.football-data.org/v4/matches
```

### Headers
```
X-Auth-Token: YOUR_API_KEY
```

### Filtros
```
?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
```

### Rate Limits (Plano Free)
- 10 requests/minuto
- 10 requests/dia
- Coberturas limitadas

### Dados Retornados
- Times (nome, logo)
- Competição
- Horário (UTC)
- Status do jogo

## 🔐 Segurança

- ✅ API key no servidor (não exposta ao cliente)
- ✅ Server Actions para operações sensíveis
- ✅ Validação de dados da API
- ✅ Try-catch em todas as operações
- ✅ Arquivo JSON em public/ (read-only para cliente)

## 🧪 Testando

### 1. Verificar Variável de Ambiente
```bash
# Verificar se está configurada
echo $FOOTBALL_DATA_API_KEY
```

### 2. Testar API Route
```bash
curl http://localhost:3000/api/matches/today
```

### 3. Testar Sincronização
1. Fazer login
2. Verificar arquivo: `public/data/matches-today.json`
3. Conferir data no arquivo

### 4. Testar Autocomplete
1. Acessar `/dashboard/bets/new`
2. Clicar no campo "Evento"
3. Digitar nome de um time
4. Verificar se aparece no dropdown

## 📈 Melhorias Futuras

- [ ] Adicionar mais competições (filtro por liga)
- [ ] Mostrar odds se disponível na API
- [ ] Cache em Redis para produção
- [ ] Webhook para atualização em tempo real
- [ ] Filtro por esporte (não só futebol)
- [ ] Suporte a múltiplos idiomas
- [ ] Pré-preencher competição ao selecionar jogo
- [ ] Mostrar status do jogo (ao vivo, finalizado)

---

**🎉 Integração Football Data API implementada com sucesso!**

