# ⚙️ Configuração da Football Data API

## ❌ Erro Atual

O erro `500` na API route indica que a chave da API não está configurada ou é inválida.

```
GET /api/matches/today 500 in 512ms
Error: Failed to fetch matches from API
```

## 🔧 Como Resolver

### 1. Adicionar Chave da API ao .env

O arquivo `.env` está protegido pelo `.gitignore`. Você precisa adicionar manualmente:

**Arquivo**: `.env` (na raiz do projeto)

```env
# Database
DATABASE_URL="postgresql://betting_user:betting_password@localhost:5432/sports_betting?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Football Data API
FOOTBALL_DATA_API_KEY=9a8afc131caf4bbb8a00a1645d635109
```

### 2. Obter Nova Chave (Recomendado para Produção)

1. Acesse: https://www.football-data.org/
2. Clique em "Get started" ou "Sign up"
3. Crie uma conta gratuita
4. Acesse seu dashboard
5. Copie sua API key
6. Substitua no `.env`

### 3. Reiniciar o Servidor

Após adicionar a chave, reinicie o servidor Next.js:

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
pnpm dev
```

## 📊 Planos Disponíveis

### Free Tier (Gratuito)
- ✅ 10 requests/minuto
- ✅ 10 requests/dia
- ✅ Coberturas limitadas
- ✅ Ideal para desenvolvimento

### Paid Tiers
- Mais requests
- Mais competições
- Dados históricos
- Odds e estatísticas

## 🧪 Testar a Configuração

### 1. Verificar se a chave está carregada

Adicione um log temporário em `app/api/matches/today/route.ts`:

```typescript
console.log("API Key:", process.env.FOOTBALL_DATA_API_KEY ? "Configured" : "Missing");
```

### 2. Testar a API diretamente

```bash
curl -X GET \
  'https://api.football-data.org/v4/matches?dateFrom=2025-11-02&dateTo=2025-11-02' \
  -H 'X-Auth-Token: SUA_CHAVE_AQUI'
```

### 3. Testar via navegador

Acesse: http://localhost:3000/api/matches/today

Deve retornar JSON com os jogos ou um erro descritivo.

## 🔍 Debug

### Logs Adicionados

O código agora inclui logs detalhados:

```typescript
console.log("Fetching matches for date:", today);
console.log("Football Data API response status:", response.status);
console.log("Matches fetched successfully:", data.matches.length, "matches");
```

### Verificar Logs

Olhe no terminal onde o Next.js está rodando para ver:
- Se a chave está configurada
- Status da resposta da API
- Mensagens de erro detalhadas

## 🛡️ Fallback Implementado

Se a API falhar, o sistema agora:

1. ✅ **Não quebra o formulário**: Retorna array vazio
2. ✅ **Mostra Input normal**: Campo "Evento" funciona manualmente
3. ✅ **Loga o erro**: Para debug
4. ✅ **Continua funcionando**: Usuário pode criar apostas normalmente

## 📝 Estrutura do .env Completo

```env
# Database
DATABASE_URL="postgresql://betting_user:betting_password@localhost:5432/sports_betting?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Football Data API
# Obtenha sua chave em: https://www.football-data.org/
FOOTBALL_DATA_API_KEY=sua_chave_aqui
```

## ⚠️ Importante

- **Nunca commite o `.env`**: Já está no `.gitignore`
- **Use `.env.example`**: Para documentar variáveis necessárias
- **Produção**: Use variáveis de ambiente do host (Vercel, etc)
- **Desenvolvimento**: Cada dev precisa configurar seu próprio `.env`

## 🎯 Próximos Passos

1. ✅ Adicionar `FOOTBALL_DATA_API_KEY` ao `.env`
2. ✅ Reiniciar servidor Next.js
3. ✅ Testar acessando `/api/matches/today`
4. ✅ Fazer login para sincronizar jogos
5. ✅ Criar nova aposta e testar autocomplete

---

**🔑 Após configurar a chave da API, o autocomplete de jogos funcionará perfeitamente!**

