// Tipos para API-Football v3
export interface ApiFootballFixture {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    date: string
    timestamp: number
    periods: {
      first: number | null
      second: number | null
    } | null
    venue: {
      id: number | null
      name: string | null
      city: string | null
    } | null
    status: {
      long: string
      short: string
      elapsed: number | null
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string | null
    flag: string | null
    season: number
    round: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string | null
      winner: boolean | null
    }
    away: {
      id: number
      name: string
      logo: string | null
      winner: boolean | null
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
    extratime: {
      home: number | null
      away: number | null
    }
    penalty: {
      home: number | null
      away: number | null
    }
  }
}

export interface ApiFootballResponse {
  get: string
  parameters: {
    date: string
  }
  errors: any[]
  results: number
  paging: {
    current: number
    total: number
  }
  response: ApiFootballFixture[]
}

// Tipos para API-Sports (Basketball)
export interface ApiBasketballGame {
  id: number
  date: string
  time: string
  timestamp: number
  timezone: string
  stage: string | null
  week: string | null
  status: {
    long: string
    short: string
    timer: string | null
  }
  league: {
    id: number
    name: string
    country: string
    logo: string | null
    flag: string | null
    season: number
  }
  country: {
    id: number
    name: string
    code: string | null
    flag: string | null
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string | null
    }
    away: {
      id: number
      name: string
      logo: string | null
    }
  }
  scores: {
    home: {
      quarter_1: number | null
      quarter_2: number | null
      quarter_3: number | null
      quarter_4: number | null
      overtime: number | null
      total: number | null
    }
    away: {
      quarter_1: number | null
      quarter_2: number | null
      quarter_3: number | null
      quarter_4: number | null
      overtime: number | null
      total: number | null
    }
  }
}

export interface ApiBasketballResponse {
  get: string
  parameters: {
    date: string
  }
  errors: any[]
  results: number
  paging: {
    current: number
    total: number
  }
  response: ApiBasketballGame[]
}

// Tipos de domínio
export interface Fixture {
  id: string
  apiId: number
  sport: 'FUTEBOL' | 'BASQUETE'
  date: Date
  time: string | null
  utcDate: Date
  status: string
  homeScore: number | null
  awayScore: number | null
  homeTeam: {
    id: string
    apiId: number
    name: string
    logo: string | null
  }
  awayTeam: {
    id: string
    apiId: number
    name: string
    logo: string | null
  }
  league: {
    id: string
    apiId: number
    name: string
    logo: string | null
    country: string | null
  }
}

export interface SyncFixturesResult {
  success: boolean
  error?: string
  footballCount?: number
  syncedAt?: Date
}

