# Integrações e APIs Externas

O sistema RiosBlack se integra com serviços externos para obtenção de dados esportivos em tempo real.

## 1. API-Football (RapidAPI)
A principal fonte de dados para o sistema de gestão de apostas.

- **Versão**: v3
- **Provedor**: API-Sports (RapidAPI)
- **Dados Coletados**:
  - **Leagues**: Campeonatos mundiais filtrados por esporte.
  - **Teams**: Informações sobre clubes (nome, logo, ID).
  - **Fixtures (Matches)**: Jogos programados, horários, estádios e placares em tempo real.
  - **Odds**: Cotações para diversos mercados (pre-match).

### Fluxo de Sincronização
1. O sistema verifica o modelo `FixtureSync` para saber se a data já foi processada.
2. Faz chamadas aos endpoints de `/fixtures` e `/leagues`.
3. Utiliza lógica de `upsert` no Prisma para atualizar dados de times e jogos sem gerar duplicidade.

## 2. Supabase (Opcional/Futuro)
O diretório `@/lib/supabase` indica uma possível integração para:
- Storage de imagens de perfil ou evidências de apostas.
- Real-time subscriptions caso se deseje notificações push.

## 3. PostgreSQL (Datastore)
Embora interno, é tratado como uma camada de serviço via Prisma ORM. Localizado em um container Docker para desenvolvimento ou no serviço Neon/PostgreSQL em produção.

---

## Variáveis de Ambiente Necessárias
As integrações dependem das seguintes chaves no arquivo `.env`:
- `API_FOOTBALL_KEY`: Chave de acesso à RapidAPI.
- `DATABASE_URL`: String de conexão com o PostgreSQL.
- `AUTH_SECRET`: Chave de criptografia para sessions JWT.
