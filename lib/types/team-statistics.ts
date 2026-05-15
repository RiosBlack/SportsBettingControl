import type { Prisma } from "@prisma/client";

export const DEFAULT_TEAM_STATS_MATCH_LIMIT = 10;

export type TeamStatKey =
  | "possession"
  | "goals"
  | "shotsTotal"
  | "shotsOnTarget"
  | "shotsOffTarget"
  | "shotsBlocked"
  | "shotsFirstHalf"
  | "corners"
  | "cornersFirstHalf"
  | "cornersSecondHalf"
  | "fouls"
  | "foulsFirstHalf"
  | "offsides"
  | "yellowCards"
  | "redCards"
  | "cardsFirstHalf"
  | "cardsSecondHalf"
  | "saves"
  | "passes"
  | "passesAccurate"
  | "crosses"
  | "freeKicks"
  | "throwIns"
  | "goalKicks"
  | "goalsFirstHalf"
  | "goalsSecondHalf";

export type DerivedStatKey =
  | "btts"
  | "scoredFirst"
  | "wonFirstHalf"
  | "wonSecondHalf"
  | "mostFirstHalfCorners"
  | "mostSecondHalfCorners";

export type TeamMatchStats = Partial<Record<TeamStatKey, number | null>>;
export type TeamMatchDerived = Partial<
  Record<DerivedStatKey, boolean | null>
>;

export interface StatCategory {
  id: string;
  label: string;
  stats: { key: TeamStatKey; label: string }[];
}

export const STAT_CATEGORIES: StatCategory[] = [
  {
    id: "shots",
    label: "Chutes",
    stats: [
      { key: "shotsTotal", label: "Chutes totais" },
      { key: "shotsFirstHalf", label: "Chutes (1º tempo)" },
      { key: "shotsOnTarget", label: "Chutes no gol" },
      { key: "shotsBlocked", label: "Chutes bloqueados" },
      { key: "shotsOffTarget", label: "Chutes fora" },
    ],
  },
  {
    id: "goals",
    label: "Gols",
    stats: [
      { key: "goals", label: "Gols" },
      { key: "goalsFirstHalf", label: "Gols 1º tempo" },
      { key: "goalsSecondHalf", label: "Gols 2º tempo" },
    ],
  },
  {
    id: "passing",
    label: "Passes",
    stats: [
      { key: "passes", label: "Passes" },
      { key: "passesAccurate", label: "Passes certos" },
      { key: "crosses", label: "Cruzamentos" },
    ],
  },
  {
    id: "cards",
    label: "Cartões",
    stats: [
      { key: "yellowCards", label: "Amarelos" },
      { key: "redCards", label: "Vermelhos" },
      { key: "cardsFirstHalf", label: "Cartões 1º tempo" },
      { key: "cardsSecondHalf", label: "Cartões 2º tempo" },
    ],
  },
  {
    id: "other",
    label: "Outros",
    stats: [
      { key: "possession", label: "Posse de bola" },
      { key: "corners", label: "Escanteios" },
      { key: "cornersFirstHalf", label: "Escanteios 1º tempo" },
      { key: "cornersSecondHalf", label: "Escanteios 2º tempo" },
      { key: "fouls", label: "Faltas" },
      { key: "foulsFirstHalf", label: "Faltas 1º tempo" },
      { key: "offsides", label: "Impedimentos" },
      { key: "saves", label: "Defesas do goleiro" },
      { key: "freeKicks", label: "Faltas (cobradas)" },
      { key: "throwIns", label: "Laterais" },
      { key: "goalKicks", label: "Tiros de meta" },
    ],
  },
  {
    id: "derived",
    label: "Indicadores",
    stats: [],
  },
];

export const DERIVED_LABELS: Record<DerivedStatKey, string> = {
  btts: "Ambos marcam",
  scoredFirst: "Marcou primeiro",
  wonFirstHalf: "Venceu 1º tempo",
  wonSecondHalf: "Venceu 2º tempo",
  mostFirstHalfCorners: "Mais escanteios 1T",
  mostSecondHalfCorners: "Mais escanteios 2T",
};

export interface ApiFootballStatisticItem {
  type: string;
  value: number | string | null;
}

export interface ApiFootballFixtureStatistics {
  team: { id: number; name: string; logo: string | null };
  statistics: ApiFootballStatisticItem[];
}

export interface ApiFootballFixtureStatisticsResponse {
  response: ApiFootballFixtureStatistics[];
}

export interface ApiFootballFixtureEvent {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

export interface ApiFootballFixtureEventsResponse {
  response: ApiFootballFixtureEvent[];
}

export interface ApiFootballTeamFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: {
    id: number;
    name: string;
    season: number;
    logo: string | null;
    country: string;
  };
  teams: {
    home: { id: number; name: string; logo: string | null; winner: boolean | null };
    away: { id: number; name: string; logo: string | null; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
}

export interface ApiFootballTeamsResponse {
  response: Array<{
    team: { id: number; name: string; logo: string | null };
  }>;
}

export interface ApiFootballLeagueByTeamItem {
  league: {
    id: number;
    name: string;
    logo: string | null;
    type: string;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

export interface TeamLeagueOption {
  leagueId: string;
  season: number;
  statsCount?: number;
  seasonComplete?: boolean;
  league: {
    id: string;
    name: string;
    logo: string | null;
    apiId?: number;
  };
}

export interface TeamStatisticsMatchColumn {
  matchId: string;
  matchApiId: number;
  date: Date;
  isHome: boolean;
  teamValue: number | boolean | null;
  opponentValue: number | boolean | null;
  homeScore: number | null;
  awayScore: number | null;
  opponent: { id: string; name: string; logo: string | null };
  venue: "home" | "away";
}

export interface TeamStatisticsPageData {
  team: { id: string; apiId: number; name: string; logo: string | null };
  league: { id: string; apiId: number; name: string; logo: string | null; country: string | null };
  season: number;
  nextFixture: {
    date: Date;
    time: string | null;
    opponent: { id: string; name: string; logo: string | null };
    isHome: boolean;
  } | null;
  columns: TeamStatisticsMatchColumn[];
  statKey: TeamStatKey | DerivedStatKey;
  isDerived: boolean;
  totalMatches: number;
}

export interface TeamStatisticsMatchInfo {
  matchId: string;
  matchApiId: number;
  date: Date;
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  opponent: { id: string; name: string; logo: string | null };
}

export interface TeamStatisticsTableCell {
  teamValue: number | boolean | null;
  opponentValue: number | boolean | null;
}

export interface TeamStatisticsTableRow {
  key: TeamStatKey | DerivedStatKey;
  label: string;
  category: string;
  isDerived: boolean;
  format: "number" | "percent" | "boolean";
  values: TeamStatisticsTableCell[];
}

export interface TeamStatisticsFullTableData {
  team: { id: string; apiId: number; name: string; logo: string | null };
  league: { id: string; apiId: number; name: string; logo: string | null; country: string | null };
  season: number;
  nextFixture: TeamStatisticsPageData["nextFixture"];
  matches: TeamStatisticsMatchInfo[];
  rows: TeamStatisticsTableRow[];
  totalMatches: number;
}

/** Linhas da tabela completa (estilo PlayerStats) — ordem de exibição. */
export const FULL_TABLE_STAT_ROWS: Array<{
  key: TeamStatKey | DerivedStatKey;
  label: string;
  category: string;
  isDerived?: boolean;
  format?: "number" | "percent" | "boolean";
}> = [
  { category: "Geral", key: "possession", label: "Posse de bola", format: "percent" },
  { category: "Gols", key: "goals", label: "Gols" },
  { category: "Gols", key: "goalsFirstHalf", label: "Gols 1º tempo" },
  { category: "Gols", key: "goalsSecondHalf", label: "Gols 2º tempo" },
  { category: "Passes", key: "passes", label: "Passes" },
  { category: "Passes", key: "passesAccurate", label: "Passes certos" },
  { category: "Chutes", key: "shotsTotal", label: "Chutes totais" },
  { category: "Chutes", key: "shotsFirstHalf", label: "Chutes (1º tempo)" },
  { category: "Chutes", key: "shotsOnTarget", label: "Chutes no gol" },
  { category: "Chutes", key: "shotsBlocked", label: "Chutes bloqueados" },
  { category: "Chutes", key: "shotsOffTarget", label: "Chutes fora" },
  { category: "Escanteios", key: "corners", label: "Escanteios" },
  { category: "Escanteios", key: "cornersFirstHalf", label: "Escanteios 1º tempo" },
  { category: "Escanteios", key: "cornersSecondHalf", label: "Escanteios 2º tempo" },
  { category: "Faltas", key: "fouls", label: "Faltas" },
  { category: "Faltas", key: "foulsFirstHalf", label: "Faltas (1º tempo)" },
  { category: "Cartões", key: "yellowCards", label: "Amarelos" },
  { category: "Cartões", key: "redCards", label: "Vermelhos" },
  { category: "Cartões", key: "cardsFirstHalf", label: "Cartões 1º tempo" },
  { category: "Cartões", key: "cardsSecondHalf", label: "Cartões 2º tempo" },
  { category: "Outros", key: "offsides", label: "Impedimentos" },
  { category: "Outros", key: "crosses", label: "Cruzamentos" },
  { category: "Outros", key: "saves", label: "Defesas do goleiro" },
  { category: "Outros", key: "freeKicks", label: "Faltas (cobradas)" },
  { category: "Outros", key: "throwIns", label: "Laterais" },
  { category: "Outros", key: "goalKicks", label: "Tiros de meta" },
  { category: "Indicadores", key: "btts", label: "Ambos marcam", isDerived: true, format: "boolean" },
  { category: "Indicadores", key: "scoredFirst", label: "Marcou primeiro", isDerived: true, format: "boolean" },
  { category: "Indicadores", key: "wonFirstHalf", label: "Venceu 1º tempo", isDerived: true, format: "boolean" },
  { category: "Indicadores", key: "wonSecondHalf", label: "Venceu 2º tempo", isDerived: true, format: "boolean" },
  { category: "Indicadores", key: "mostFirstHalfCorners", label: "Mais escanteios 1T", isDerived: true, format: "boolean" },
  { category: "Indicadores", key: "mostSecondHalfCorners", label: "Mais escanteios 2T", isDerived: true, format: "boolean" },
];

export interface SyncTeamStatisticsResult {
  success: boolean;
  processed: number;
  skipped: number;
  cached?: boolean;
  season?: number;
  displayReady?: boolean;
  seasonComplete?: boolean;
  statsCount?: number;
  expectedFixtures?: number;
  warning?: string;
  error?: string;
}

export type MatchTeamStatisticRecord = {
  id: string;
  matchId: string;
  teamId: string;
  opponentTeamId: string;
  leagueId: string;
  season: number;
  isHome: boolean;
  stats: Prisma.JsonValue;
  derived: Prisma.JsonValue;
  match: {
    id: string;
    apiId: number;
    date: Date;
    homeScore: number | null;
    awayScore: number | null;
    homeTeamId: string;
    awayTeamId: string;
  };
};
