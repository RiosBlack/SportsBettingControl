-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('API_FOOTBALL', 'FOOTBALL_DATA', 'MANUAL');

-- CreateTable
CREATE TABLE "sport_events" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" "EventSource" NOT NULL,
    "sport" "Sport" NOT NULL DEFAULT 'FUTEBOL',
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "homeTeamLogo" TEXT,
    "awayTeamLogo" TEXT,
    "competition" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_events_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "bets" ADD COLUMN "sportEventId" TEXT;

-- CreateIndex
CREATE INDEX "sport_events_homeTeamName_idx" ON "sport_events"("homeTeamName");

-- CreateIndex
CREATE INDEX "sport_events_awayTeamName_idx" ON "sport_events"("awayTeamName");

-- CreateIndex
CREATE INDEX "sport_events_competition_idx" ON "sport_events"("competition");

-- CreateIndex
CREATE INDEX "sport_events_eventDate_idx" ON "sport_events"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "sport_events_source_externalId_key" ON "sport_events"("source", "externalId");

-- CreateIndex
CREATE INDEX "bets_sportEventId_idx" ON "bets"("sportEventId");

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_sportEventId_fkey" FOREIGN KEY ("sportEventId") REFERENCES "sport_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
