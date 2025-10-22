# 🎲 Sports Betting Control

Sistema de controle e gerenciamento de apostas esportivas desenvolvido com Next.js, TypeScript e PostgreSQL.

## 🚀 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **PostgreSQL 16** - Banco de dados
- **Prisma 6** - ORM (Object-Relational Mapping)
- **NextAuth.js v5** - Autenticação
- **Docker** - Containerização
- **TailwindCSS** - Estilização
- **Zod** - Validação de dados
- **shadcn/ui** - Componentes UI
- **bcryptjs** - Hash de senhas

## 📋 Pré-requisitos

- Node.js 18 ou superior
- pnpm (gerenciador de pacotes)
- Docker e Docker Compose

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd sports-betting-control
```

### 2. Instale as dependências
```bash
pnpm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas credenciais se necessário.

### 4. Inicie o banco de dados
```bash
docker compose up -d
```

Isso iniciará:
- PostgreSQL na porta 5432
- PgAdmin na porta 5050 (opcional, para gerenciar o banco visualmente)

### 5. Execute as migrations do banco
```bash
pnpm prisma migrate dev
```

### 6. Execute o projeto em desenvolvimento
```bash
pnpm dev
```

Acesse:
- **Aplicação**: [http://localhost:3000](http://localhost:3000)
- **Login**: [http://localhost:3000/login](http://localhost:3000/login)
- **Registro**: [http://localhost:3000/register](http://localhost:3000/register)
- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (requer login)

## 🐳 Docker

### Usando o script de ajuda (recomendado)

```bash
# Iniciar containers
./docker-help.sh start

# Parar containers
./docker-help.sh stop

# Ver status
./docker-help.sh status

# Ver logs
./docker-help.sh logs

# Reiniciar
./docker-help.sh restart

# Limpar tudo (remove dados!)
./docker-help.sh clean
```

### Comandos diretos (alternativa)

```bash
# Iniciar containers
docker compose up -d

# Parar containers
docker compose down

# Ver logs do PostgreSQL
docker compose logs -f postgres

# Ver status dos containers
docker compose ps

# Reiniciar containers
docker compose restart

# Remover containers e volumes (CUIDADO: apaga os dados!)
docker compose down -v
```

### Acessar PgAdmin

1. Acesse: [http://localhost:5050](http://localhost:5050)
2. Login:
   - Email: `admin@admin.com`
   - Senha: `admin`
3. Adicione um novo servidor:
   - Host: `postgres` (nome do container)
   - Port: `5432`
   - Database: `sports_betting`
   - Username: `betting_user`
   - Password: `betting_password`

## 📦 Scripts disponíveis

### Desenvolvimento
```bash
pnpm dev          # Inicia o servidor de desenvolvimento
pnpm build        # Cria build de produção
pnpm start        # Inicia servidor de produção
pnpm lint         # Executa o linter
```

### Banco de Dados (Prisma)
```bash
pnpm prisma studio        # Abre interface visual do banco
pnpm prisma migrate dev   # Cria e aplica migrations
pnpm prisma generate      # Gera Prisma Client
pnpm prisma validate      # Valida o schema
pnpm prisma format        # Formata o schema
```

### Docker
```bash
./docker-help.sh start    # Inicia containers
./docker-help.sh stop     # Para containers
./docker-help.sh status   # Status dos containers
./docker-help.sh logs     # Ver logs do PostgreSQL
```

## 📁 Estrutura do Projeto

```
sports-betting-control/
├── app/                    # Páginas Next.js (App Router)
│   ├── api/
│   │   └── auth/          # API routes NextAuth
│   ├── login/             # Página de login
│   ├── register/          # Página de registro
│   └── dashboard/         # Dashboard (protegido)
├── components/             # Componentes React
│   ├── ui/                # Componentes shadcn/ui
│   ├── bankroll-manager.tsx
│   ├── bet-form.tsx
│   └── bets-list.tsx
├── lib/
│   ├── actions/           # Server Actions
│   │   └── auth.ts       # Ações de autenticação
│   ├── prisma.ts          # Cliente Prisma
│   └── utils.ts           # Utilitários
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   ├── migrations/        # Migrations
│   └── examples.ts        # Exemplos de uso
├── types/                  # Tipos TypeScript
├── auth.config.ts         # Config NextAuth
├── auth.ts                # Handlers NextAuth
├── middleware.ts          # Proteção de rotas
├── docker-compose.yml     # Configuração Docker
└── DOCUMENTATION.md       # Documentação detalhada
```

## 📚 Documentação

Para informações detalhadas sobre o projeto, regras de negócio e padrões de desenvolvimento, consulte [DOCUMENTATION.md](./DOCUMENTATION.md).

## 🤝 Contribuindo

1. Sempre use `pnpm` como gerenciador de pacotes
2. Siga os padrões de código definidos
3. Documente mudanças significativas
4. Remova `console.log` antes de commitar

## 📝 Licença

Este projeto é privado.

