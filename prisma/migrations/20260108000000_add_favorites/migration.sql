-- CreateTable
CREATE TABLE "favorite_leagues" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_teams" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_leagues_userId_leagueId_key" ON "favorite_leagues"("userId", "leagueId");

-- CreateIndex
CREATE INDEX "favorite_leagues_userId_idx" ON "favorite_leagues"("userId");

-- CreateIndex
CREATE INDEX "favorite_leagues_leagueId_idx" ON "favorite_leagues"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_teams_userId_teamId_key" ON "favorite_teams"("userId", "teamId");

-- CreateIndex
CREATE INDEX "favorite_teams_userId_idx" ON "favorite_teams"("userId");

-- CreateIndex
CREATE INDEX "favorite_teams_teamId_idx" ON "favorite_teams"("teamId");

-- AddForeignKey
ALTER TABLE "favorite_leagues" ADD CONSTRAINT "favorite_leagues_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_leagues" ADD CONSTRAINT "favorite_leagues_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_teams" ADD CONSTRAINT "favorite_teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_teams" ADD CONSTRAINT "favorite_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

