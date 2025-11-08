# Configuração de Variáveis de Ambiente na Vercel

## ⚠️ IMPORTANTE: Configurar estas variáveis na Vercel

Para que o middleware funcione corretamente na Vercel, você precisa configurar as seguintes variáveis de ambiente:

### 1. DATABASE_URL
```
postgresql://user:password@host:5432/database
```
- URL de conexão com o banco de dados PostgreSQL

### 2. NEXTAUTH_SECRET
```bash
# Gerar com o comando:
openssl rand -base64 32
```
- Chave secreta para criptografia do NextAuth
- **OBRIGATÓRIA** para o middleware funcionar

### 3. NEXTAUTH_URL
```
https://bet.drinovacoes.com.br
```
- URL completa do seu domínio na Vercel
- **IMPORTANTE**: Use `https://` e o domínio exato
- Sem barra no final

### 4. API_FOOTBALL_KEY (opcional)
```
sua-chave-da-api-football
```
- Chave da API Football (se estiver usando)

## 🔧 Como Configurar na Vercel

1. Acesse: https://vercel.com/seu-usuario/seu-projeto/settings/environment-variables
2. Adicione cada variável acima
3. Selecione os ambientes: **Production**, **Preview**, **Development**
4. Clique em "Save"
5. Faça um novo deploy

## ✅ Verificar se está configurado

Após configurar, faça um novo deploy e verifique os logs:
- Se aparecer "NEXTAUTH_SECRET não está definido!" → Variável não foi configurada
- Se aparecer "Erro ao obter token" → Verifique o NEXTAUTH_URL

## 🐛 Solução do Erro "Invalid URL"

O erro `Invalid URL: bet.drinovacoes.com.br` acontece quando:
- `NEXTAUTH_URL` não está configurado
- `NEXTAUTH_URL` está sem `https://`
- `NEXTAUTH_SECRET` não está configurado

**Solução:**
```
NEXTAUTH_URL=https://bet.drinovacoes.com.br
NEXTAUTH_SECRET=sua-chave-gerada-com-openssl
```

## 📝 Exemplo Completo

```env
DATABASE_URL="postgresql://user:pass@host.com:5432/db"
NEXTAUTH_SECRET="abc123xyz789..." # Gerar com openssl rand -base64 32
NEXTAUTH_URL="https://bet.drinovacoes.com.br"
API_FOOTBALL_KEY="sua-chave" # Opcional
```

