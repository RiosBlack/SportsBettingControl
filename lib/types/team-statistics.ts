import type { Prisma } from "@prisma/client";

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

export interface SyncTeamStatisticsResult {
  success: boolean;
  processed: number;
  skipped: number;
  cached?: boolean;
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
