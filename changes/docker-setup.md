# Configuração Docker PostgreSQL

**Data**: 30/09/2025  
**Tipo**: Nova Feature  
**Autor**: Sistema

## 📝 Descrição
Implementação da configuração Docker para executar o PostgreSQL como banco de dados do projeto.

## 🔧 Arquivos Criados
1. **docker-compose.yml** - Configuração dos containers Docker
2. **.env.example** - Template de variáveis de ambiente
3. **DOCUMENTATION.md** - Documentação inicial do projeto
4. **changes/docker-setup.md** - Este arquivo de registro

## 🐳 O que foi implementado

### Docker Compose
- **PostgreSQL 16 Alpine**: Banco de dados principal
  - Porta: 5432 (configurável)
  - Volume persistente para dados
  - Health check configurado
  - Restart automático

- **PgAdmin 4** (Opcional): Interface web para gerenciar o banco
  - Porta: 5050 (configurável)
  - Acesso via navegador
  - Conectado automaticamente ao PostgreSQL

### Variáveis de Ambiente
Criado arquivo `.env.example` com as seguintes configurações:
- `POSTGRES_USER`: Usuário do banco (padrão: betting_user)
- `POSTGRES_PASSWORD`: Senha do banco (padrão: betting_password)
- `POSTGRES_DB`: Nome do banco (padrão: sports_betting)
- `POSTGRES_PORT`: Porta do banco (padrão: 5432)
- `DATABASE_URL`: URL de conexão completa
- `PGADMIN_EMAIL`: Email para acessar PgAdmin
- `PGADMIN_PASSWORD`: Senha do PgAdmin
- `PGADMIN_PORT`: Porta do PgAdmin (padrão: 5050)

## 🚀 Como usar

### 1. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

### 2. Iniciar o banco de dados
```bash
docker compose up -d
```

### 3. Verificar se está rodando
```bash
docker compose ps
```

### 4. Acessar PgAdmin (opcional)
Abra o navegador em: http://localhost:5050
- Email: admin@admin.com (ou o configurado no .env)
- Senha: admin (ou a configurada no .env)

### 5. Parar o banco de dados
```bash
docker compose down
```

### 6. Ver logs
```bash
docker compose logs -f postgres
```

## 📊 Impactos
- ✅ Banco de dados PostgreSQL disponível localmente
- ✅ Dados persistentes em volume Docker
- ✅ Interface de gerenciamento (PgAdmin) disponível
- ✅ Configuração via variáveis de ambiente
- ✅ Fácil de replicar em outros ambientes

## ⏭️ Próximos Passos
1. Configurar ORM (Prisma ou Drizzle) para conectar com o banco
2. Criar migrations para as tabelas do sistema
3. Implementar models de dados (Apostas, Bankroll, etc.)
4. Configurar seeds para dados iniciais (opcional)

## 📌 Observações
- O arquivo `.env` deve estar no `.gitignore` para não versionar credenciais
- As credenciais padrão devem ser alteradas em produção
- O PgAdmin é opcional e pode ser removido se não for necessário
- Os volumes Docker garantem que os dados não sejam perdidos ao reiniciar o container

