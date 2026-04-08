# 2026-04-08 - Bug Investigation: Constant DB Queries

## Problem
The user reported that the application is making database queries "all the time".

## Analysis
After investigating the codebase, several factors were identified that contribute to a high volume of database queries, especially in a development environment:

1. **Prisma Logging**: The `lib/prisma.ts` is configured to log all queries in development (`log: ['query']`).
2. **Heavy Background Sync**: The `FixturesSync` component in the dashboard layout triggers a background sync to `/api/fixtures/sync` on mount. This sync operation can perform over 400 queries (upserts for leagues, teams, and matches) in a single run.
3. **Double Execution in Dev**: React 18 Strict Mode and Next.js development server may trigger effects and server components twice, doubling the query count.
4. **Redundant Auth Calls**: Server Actions and pages call `auth()` or `getCurrentUser()` multiple times per request, each potentially querying the session database.
5. **Dashboard Stats**: The main dashboard page and its components (like `PeriodStatsCard`) perform multiple separate queries to calculate ROI, win rate, and total profit.

## Fixes Implemented

1. **Throttled Background Sync**:
   - Modified `FixturesSync` (layout component) to use `sessionStorage`.
   - Now only triggers a background sync attempt once every 30 minutes per browser session, preventing redundant calls on navigation or layout re-renders.

2. **Deduplicated User Queries**:
   - Added `React.cache` to `getCurrentUser` in `lib/auth/get-user.ts`.
   - This prevents multiple separate database queries for the same user profile within a single server-side request (affects dashboard and stats pages).

3. **Optimized Sync Logic**:
   - Improved `processFootballFixtures` in `lib/actions/fixtures.ts` by implementing local caching for leagues and teams during a sync run.
   - This drastically reduces queries by skipping `upsert` calls for entities already processed in the current batch (common for matches in the same league).

4. **Eliminated Redundant Client Fetches**:
   - Updated `FixturesPageClient` to skip the initial `useEffect` fetch if it matches the `initialFixtures` provided by the server component.

## Impact
- Drastic reduction in query logs in development.
- Faster page loads due to memoized user lookups.
- Reduced database load during daily background syncs.
- Better battery/performance on client side by avoiding redundant background tasks.
