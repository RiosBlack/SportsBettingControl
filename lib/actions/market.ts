"use server";

import { prisma } from "@/lib/prisma";

export interface Market {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Buscar todos os mercados
export async function getMarkets(): Promise<{
  success: boolean;
  data?: Market[];
  error?: string;
}> {
  try {
    const markets = await prisma.market.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: markets,
    };
  } catch (error: any) {
    console.error("Error getting markets:", error);
    return {
      success: false,
      error: error.message || "Failed to get markets",
    };
  }
}

// Criar novo mercado
export async function createMarket(name: string): Promise<{
  success: boolean;
  data?: Market;
  error?: string;
}> {
  try {
    // Validar nome
    if (!name || name.trim().length < 3) {
      return {
        success: false,
        error: "Nome do mercado deve ter no mínimo 3 caracteres",
      };
    }

    // Verificar se já existe
    const existing = await prisma.market.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return {
        success: false,
        error: "Mercado com este nome já existe",
      };
    }

    const market = await prisma.market.create({
      data: {
        name: name.trim(),
      },
    });

    return {
      success: true,
      data: market,
    };
  } catch (error: any) {
    console.error("Error creating market:", error);
    
    // Verificar se é erro de unique constraint
    if (error.code === "P2002") {
      return {
        success: false,
        error: "Mercado com este nome já existe",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to create market",
    };
  }
}

// Atualizar mercado
export async function updateMarket(
  id: string,
  name: string
): Promise<{
  success: boolean;
  data?: Market;
  error?: string;
}> {
  try {
    // Validar nome
    if (!name || name.trim().length < 3) {
      return {
        success: false,
        error: "Nome do mercado deve ter no mínimo 3 caracteres",
      };
    }

    const market = await prisma.market.update({
      where: { id },
      data: {
        name: name.trim(),
      },
    });

    return {
      success: true,
      data: market,
    };
  } catch (error: any) {
    console.error("Error updating market:", error);
    
    if (error.code === "P2025") {
      return {
        success: false,
        error: "Mercado não encontrado",
      };
    }

    if (error.code === "P2002") {
      return {
        success: false,
        error: "Mercado com este nome já existe",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to update market",
    };
  }
}

// Deletar mercado
export async function deleteMarket(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Verificar se o mercado está sendo usado em alguma aposta
    const betsCount = await prisma.bet.count({
      where: { marketId: id },
    });

    if (betsCount > 0) {
      return {
        success: false,
        error: `Não é possível deletar este mercado pois está sendo usado em ${betsCount} aposta(s)`,
      };
    }

    await prisma.market.delete({
      where: { id },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error deleting market:", error);
    
    if (error.code === "P2025") {
      return {
        success: false,
        error: "Mercado não encontrado",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to delete market",
    };
  }
}

