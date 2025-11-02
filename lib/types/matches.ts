export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  competition: string;
  time: string;
  utcDate: string;
}

export interface MatchesData {
  date: string;
  matches: Match[];
  lastUpdated: string;
}

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  competition: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  };
}

export interface FootballDataResponse {
  matches: FootballDataMatch[];
}

