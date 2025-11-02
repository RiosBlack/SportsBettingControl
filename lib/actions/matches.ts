"use server";

import { promises as fs } from "fs";
import path from "path";
import type { MatchesData } from "@/lib/types/matches";

const MATCHES_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "matches-today.json"
);

// Garantir que o diretório existe
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "public", "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Sincronizar jogos do dia
export async function syncTodayMatches() {
  try {
    await ensureDataDirectory();

    // Buscar da API route
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    console.log("Syncing matches from:", `${baseUrl}/api/matches/today`);
    
    const response = await fetch(`${baseUrl}/api/matches/today`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("API route error:", response.status, errorData);
      throw new Error(`Failed to fetch matches: ${response.status} - ${errorData.error || "Unknown error"}`);
    }

    const data: MatchesData = await response.json();
    console.log("Matches fetched successfully:", data.matches.length, "matches");

    // Salvar no arquivo
    await fs.writeFile(MATCHES_FILE_PATH, JSON.stringify(data, null, 2));

    return { success: true, data };
  } catch (error: any) {
    console.error("Error syncing matches:", error);
    return { success: false, error: error.message };
  }
}

// Obter jogos do dia (do arquivo local)
export async function getTodayMatches(): Promise<MatchesData | null> {
  try {
    await ensureDataDirectory();

    // Verificar se o arquivo existe
    try {
      await fs.access(MATCHES_FILE_PATH);
    } catch {
      // Arquivo não existe, tentar sincronizar
      console.log("Matches file not found, syncing...");
      const result = await syncTodayMatches();
      if (!result.success) {
        console.warn("Failed to sync matches, returning empty data");
        // Retornar estrutura vazia ao invés de null para não quebrar o formulário
        return {
          date: new Date().toISOString().split("T")[0],
          matches: [],
          lastUpdated: new Date().toISOString(),
        };
      }
      return result.data;
    }

    // Ler o arquivo
    const fileContent = await fs.readFile(MATCHES_FILE_PATH, "utf-8");
    const data: MatchesData = JSON.parse(fileContent);

    // Verificar se os dados são de hoje
    const today = new Date().toISOString().split("T")[0];
    if (data.date !== today) {
      // Dados antigos, sincronizar novamente
      console.log("Matches data is old, syncing...");
      const result = await syncTodayMatches();
      return result.success ? result.data : data; // Retorna dados antigos se falhar
    }

    return data;
  } catch (error: any) {
    console.error("Error getting matches:", error);
    // Retornar estrutura vazia ao invés de null
    return {
      date: new Date().toISOString().split("T")[0],
      matches: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Buscar jogos por nome do time
export async function searchMatchesByTeam(
  teamName: string
): Promise<MatchesData["matches"]> {
  const data = await getTodayMatches();
  if (!data) return [];

  const searchTerm = teamName.toLowerCase();
  return data.matches.filter(
    (match) =>
      match.homeTeam.toLowerCase().includes(searchTerm) ||
      match.awayTeam.toLowerCase().includes(searchTerm)
  );
}

