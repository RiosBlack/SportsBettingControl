# Documentação - Sports Betting Control

## 📋 Resumo do Projeto
Sistema de controle de apostas esportivas desenvolvido com Next.js 15, TypeScript e PostgreSQL. O projeto permite gerenciar bankroll, registrar apostas e acompanhar resultados.

## 💼 Regras de Negócio
- Gerenciamento de bankroll (banca de apostas)
- Registro de apostas com informações detalhadas
- Acompanhamento de resultados e estatísticas
- Interface responsiva e moderna

## 📁 Estrutura de Pastas
```
sports-betting-control/
├── app/                    # Páginas Next.js (App Router)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Componentes React
│   ├── ui/                # Componentes da biblioteca shadcn/ui
│   ├── bankroll-manager.tsx
│   ├── bet-form.tsx
│   ├── bets-list.tsx
│   └── theme-provider.tsx
├── hooks/                  # Custom hooks
├── lib/                    # Utilitários
├── public/                 # Arquivos estáticos
├── styles/                 # Estilos globais
└── docker-compose.yml     # Configuração Docker do PostgreSQL
```

## 📚 Bibliotecas Instaladas
- **Next.js 15.2.4** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript 5** - Tipagem estática
- **TailwindCSS 3.4.17** - Framework CSS
- **Prisma 6.16.3** - ORM para PostgreSQL
- **@prisma/client 6.16.3** - Cliente Prisma
- **NextAuth.js 5.0.0-beta.29** - Autenticação
- **@auth/prisma-adapter 2.10.0** - Adapter Prisma para NextAuth
- **bcryptjs 3.0.2** - Hash de senhas
- **Zod 3.24.1** - Validação de schemas
- **React Hook Form 7.54.1** - Gerenciamento de formulários
- **@hookform/resolvers 3.9.1** - Integração Zod com React Hook Form
- **next-themes 0.4.4** - Gerenciamento de temas
- **lucide-react 0.454.0** - Ícones
- **shadcn/ui (Radix UI)** - Biblioteca de componentes
- **date-fns 4.1.0** - Manipulação de datas
- **recharts 2.15.0** - Gráficos
- **sonner 1.7.1** - Notificações toast

## 🚀 Funcionalidades Existentes
- ✅ Sistema de autenticação completo (NextAuth.js v5)
- ✅ Login com email/senha
- ✅ Registro de usuários
- ✅ Login com Google (configurável)
- ✅ Proteção de rotas com middleware
- ✅ Dashboard protegido
- ✅ Gerenciador de Bankroll
- ✅ Formulário de registro de apostas
- ✅ Lista de apostas
- ✅ Tema claro/escuro
- ✅ Interface responsiva com componentes shadcn/ui

## 🐳 Banco de Dados
- **Banco de Dados**: PostgreSQL 16
- **ORM**: Prisma 6.16.3
- **Gerenciamento**: Docker Compose
- **Porta**: 5432
- **Credenciais**: Configuradas via variáveis de ambiente

### Schema do Banco
O banco possui os seguintes modelos:
- **User** - Usuários e autenticação
- **Account** - Contas OAuth
- **Session** - Sessões de usuário
- **VerificationToken** - Tokens de verificação
- **Bankroll** - Gestão de bancas
- **Bet** - Registro de apostas

### Comandos Úteis

#### Docker
```bash
# Iniciar banco
docker compose up -d

# Parar banco
docker compose down

# Ver logs
docker compose logs -f postgres
```

#### Prisma
```bash
# Abrir Prisma Studio (GUI)
pnpm prisma studio

# Criar migration
pnpm prisma migrate dev

# Gerar cliente
pnpm prisma generate

# Validar schema
pnpm prisma validate
```

## 🔧 Processo de Deploy
- **Plataforma**: A definir
- **Build**: `pnpm build`
- **Start**: `pnpm start`
- **Requisitos**: Node.js 18+, PostgreSQL 16+

## 📝 Regras Específicas
1. Sempre usar `pnpm` como gerenciador de pacotes
2. Componentes visuais devem ser extraídos para arquivos separados
3. Componentes de páginas devem ficar em pasta `_components`
4. Pastas que não são páginas devem começar com `_`
5. Remover todos os `console.log` antes do deploy
6. Verificar bibliotecas existentes antes de instalar novas

## 📖 Histórico de Alterações
- [Configuração Docker PostgreSQL](./changes/docker-setup.md)
- [Configuração Prisma ORM e Schema](./changes/prisma-setup.md)
- [Configuração NextAuth.js - Autenticação](./changes/nextauth-setup.md)
- [Rotas API e Server Actions](./changes/api-routes-setup.md)

