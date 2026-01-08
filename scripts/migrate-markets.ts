/**
 * Script de migração para converter markets existentes (strings) para registros na tabela Market
 * 
 * Este script:
 * 1. Busca todos os valores únicos de market (string) nas apostas existentes
 * 2. Cria registros na tabela Market para cada valor único
 * 3. Atualiza as apostas para usar os marketId correspondentes
 * 4. Remove a coluna market (string) após a migração
 * 
 * IMPORTANTE: Execute este script APÓS aplicar a migration do Prisma que adiciona a tabela Market
 * e a coluna marketId na tabela bets, mas ANTES de remover a coluna market (string).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateMarkets() {
  try {
    console.log("🚀 Iniciando migração de markets...");

    // 1. Buscar todos os valores únicos de market (string) nas apostas
    // Nota: O campo 'market' pode não existir mais no schema TypeScript, mas ainda existe no banco
    const bets = await prisma.$queryRaw<Array<{ id: string; market: string | null }>>`
      SELECT id, market 
      FROM bets 
      WHERE "marketId" IS NULL AND market IS NOT NULL
    `;

    if (bets.length === 0) {
      console.log("✅ Nenhuma aposta encontrada para migrar");
      return;
    }

    console.log(`📊 Encontradas ${bets.length} apostas para migrar`);

    // 2. Extrair valores únicos de market
    const uniqueMarkets = Array.from(
      new Set(bets.map((bet) => bet.market).filter((m): m is string => Boolean(m)))
    );

    console.log(`📝 Encontrados ${uniqueMarkets.length} mercados únicos:`, uniqueMarkets);

    // 3. Criar registros na tabela Market
    const marketMap = new Map<string, string>(); // market name -> market id

    for (const marketName of uniqueMarkets) {
      if (!marketName || marketName.trim().length === 0) {
        continue;
      }

      try {
        // Verificar se já existe
        const existing = await prisma.market.findUnique({
          where: { name: marketName.trim() },
        });

        if (existing) {
          marketMap.set(marketName, existing.id);
          console.log(`✓ Mercado já existe: ${marketName}`);
        } else {
          // Criar novo mercado
          const market = await prisma.market.create({
            data: {
              name: marketName.trim(),
            },
          });
          marketMap.set(marketName, market.id);
          console.log(`✓ Criado mercado: ${marketName} (ID: ${market.id})`);
        }
      } catch (error: any) {
        console.error(`✗ Erro ao criar mercado "${marketName}":`, error.message);
      }
    }

    // 4. Atualizar apostas com os marketId correspondentes
    let updatedCount = 0;
    let errorCount = 0;

    for (const bet of bets) {
      if (!bet.market) {
        console.warn(`⚠ Aposta ${bet.id} não tem market definido, pulando...`);
        continue;
      }

      const marketId = marketMap.get(bet.market);

      if (!marketId) {
        console.error(`✗ Não foi possível encontrar marketId para: ${bet.market}`);
        errorCount++;
        continue;
      }

      try {
        await prisma.$executeRaw`
          UPDATE bets 
          SET "marketId" = ${marketId} 
          WHERE id = ${bet.id}
        `;
        updatedCount++;
      } catch (error: any) {
        console.error(`✗ Erro ao atualizar aposta ${bet.id}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n📊 Resumo da migração:");
    console.log(`  ✓ Mercados criados/encontrados: ${marketMap.size}`);
    console.log(`  ✓ Apostas atualizadas: ${updatedCount}`);
    if (errorCount > 0) {
      console.log(`  ✗ Erros: ${errorCount}`);
    }

    console.log("\n✅ Migração concluída com sucesso!");
    console.log("\n⚠️  PRÓXIMOS PASSOS:");
    console.log("  1. Verifique se todas as apostas foram migradas corretamente");
    console.log("  2. Execute a migration do Prisma para remover a coluna 'market' (string)");
    console.log("  3. Atualize o schema.prisma removendo o campo market do modelo Bet");
  } catch (error: any) {
    console.error("❌ Erro durante a migração:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateMarkets()
  .then(() => {
    console.log("\n✨ Script finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });

