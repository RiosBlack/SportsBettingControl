-- CreateTable
CREATE TABLE "markets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markets_name_key" ON "markets"("name");

-- AlterTable
-- Adicionar a coluna marketId como nullable temporariamente (será preenchida pelo script de migração)
ALTER TABLE "bets" ADD COLUMN "marketId" TEXT;

-- Adicionar foreign key constraint (permitindo null temporariamente)
ALTER TABLE "bets" ADD CONSTRAINT "bets_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Criar índice
CREATE INDEX "bets_marketId_idx" ON "bets"("marketId");

-- NOTA IMPORTANTE:
-- 1. Execute o script scripts/migrate-markets.ts para migrar os dados existentes
-- 2. Após a migração, execute uma segunda migration para:
--    - Tornar marketId NOT NULL
--    - Remover a coluna market (string)

