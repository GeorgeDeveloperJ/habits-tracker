# Project: Proactive 31-Day Habit Tracker MVP

## Architecture
The **Proactive 31-Day Habit Tracker** is a full-stack TypeScript monorepo consisting of two tightly coupled application packages (`backend/` and `frontend/`) plus shared design & roadmap documentation (`DESIGN.md`, `ROADMAP.md`, `docs/docker.md`) and Docker orchestration (`docker-compose.yml`).

- **Backend (`backend/`)**:
  - **Runtime & Framework**: Node.js 24, Express 5 (`^5.2.1`), TypeScript (`^6.0.3`), Prisma ORM (`^6.19.3`) with PostgreSQL 15+, JWT authentication (`jsonwebtoken`, `bcrypt`), and `zod` request validation middleware.
  - **Database Layer (`backend/src/config/db.ts`)**: Standard `PrismaClient()` by default (for local PostgreSQL 15 and Docker `postgres:17-alpine`), with optional `@prisma/adapter-neon` fallback when `process.env.DB_ADAPTER === 'neon'`.
  - **Domain Models (`backend/prisma/schema.prisma`)**:
    - `User`: `id` (UUID), `email` (unique), `hashedPassword`, relations to `cycles`, `logs`, `plans`.
    - `HabitCategory`: 8 pre-seeded Core Pillars (`Learning`, `Physical Health`, `Nutrition`, `Mindfulness`, `Work / Focus`, `Finance`, `Organization`, `Rest`).
    - `Cycle`: 31-day sprint (`id`, `startDate`, `endDate`, `isActive`, `userId`). Only one active cycle per user at any time.
    - `DailyLog`: Single calendar day within a cycle (`id`, `date`, `isClosed`, `cycleId`, `userId`, `plans`). Idempotent per `(userId, cycleId, calendarDay)`.
    - `PlannedAction`: Actionable goal for one pillar on a specific `DailyLog` (`id`, `description`, `isCompleted`, `logId`, `categoryId`, `userId`). Immutable when parent `DailyLog.isClosed === true`.
- **Frontend (`frontend/`)**:
  - **Framework & Tooling**: React 19 (`^19.2.6`), Vite 8 (`^8.0.12`), Tailwind CSS v4 (`@tailwindcss/vite`), React Router v7 (`react-router-dom`), Zustand (`authStore.ts`), Axios (`api/client.ts`), Recharts (`^3.8.1`), Lucide React icons, `clsx` + `tailwind-merge`.
  - **State & Data Flow**:
    - `useAuthStore` (`frontend/src/store/authStore.ts`): Persists `{ token, user: { id, email } }` in `localStorage`.
    - `HabitProvider` (`frontend/src/context/HabitContext.tsx`): Subscribes reactively to `useAuthStore.token`. Clears state when logged out; automatically loads `categories`, `activeCycle`, `progress` (`stats`, `logs`, `pillarStats`, `dailySeries`), `todayLog`, `tomorrowLog`, and `selectedDayLog` when `token` is present.
  - **UI Screens (`DESIGN.md` — "Focused Obsidian & Electric Violet" System)**:
    1. **Screen 1 — Auth Split-Screen (`/login`, `/register`)**: Interactive 31-day value proposition panel + glassmorphic auth card with inline validation.
    2. **Screen 2 — 31-Day Sprint Launchpad (`StartSprintScreen.tsx`)**: 31-node calendar preview + Day 1 Pillar Kickoff wizard allowing immediate Day 1 goal creation upon starting a sprint.
    3. **Screen 3 — Primary Command Center (`AppLayout.tsx` + `Tracker.tsx` / `HabitGrid.tsx`)**: Collapsible left navigation rail + 12-column Bento header (31-Day interactive progress ribbon with read-only past Day Inspector, circular completion ring, "Close Today" readiness indicator & gatekeeper button) + Unified 8-Pillar Matrix with Today's Execution (checkable + inline edit/delete) alongside Tomorrow's Proactive Plan (inline quick-input + edit/delete without modal fatigue) + Day 31 completion celebration & sprint rollover.
    4. **Screen 4 — Analytics & Pillar Balance Dashboard (`/analytics`, `AnalyticsDashboard.tsx`)**: Live KPI cards, 8-Pillar Balance Chart (Recharts Radar/Bar), 31-Day Consistency Trend Chart (Recharts Area/Bar), and 8-Pillar Breakdown Table powered by real API data.

## Feature Inventory
Every Survey feature is assigned to Milestone `M1` (none unassigned).

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | `FIX-01`: Branch Consolidation & DB Adapter | Fast-forward merge `origin/dev` (`e950438`, PR #10) into `main` (`docker-compose.yml`, `Dockerfile.dev`, `Dockerfile`, `entrypoint.js`, `docs/docker.md`, `0.0.0.0` binding, `"main": "dist/index.js"`, `"start": "node dist/index.js"`, Vite `--host`, standard `PrismaClient` in `db.ts` with optional Neon fallback). Commit `ROADMAP.md` and `DESIGN.md`. | M1 | survey (`explorer_survey_1`, `spec_miner_survey_3`) |
| 2 | `FIX-02a`: User-Scoped Cycle Management | Scope `startCycle` (`POST /api/cycles` & `/api/cycles/start`) and `getCurrentCycle` (`GET /api/cycles` & `/api/cycles/current`) by `req.userId`. Deactivate prior active cycles (`isActive: false`) before creating a new 31-day cycle. Support `GET /api/cycles/history`. | M1 | survey (`explorer_survey_1`, `spec_miner_survey_3`) |
| 3 | `FIX-02b`: User-Scoped & Parameter-Aware Cycle Progress | Scope `GET /api/cycle-progress/:cycleId` by `req.userId`. Support `:cycleId === 'current'` or specific cycle UUID. Scope `dailyLog.findMany` by `{ cycleId, userId }`. | M1 | survey (`explorer_survey_1`, `spec_miner_survey_3`) |
| 4 | `FIX-02c`: User-Scoped & Idempotent Daily Logs | Scope `POST /api/days`, `GET /api/days`, and `PATCH /api/days/:id` by `req.userId`. Make `POST /api/days` idempotent per calendar day (`targetDate: 'today' \| 'tomorrow'`) within the active cycle. | M1 | survey (`explorer_survey_1`, `spec_miner_survey_3`) |
| 5 | `FIX-02d`: User-Scoped Planned Actions | Scope `POST /api/actions`, `PATCH /api/actions/:id`, and `DELETE /api/actions/:id` by `req.userId`. Verify user ownership of target `DailyLog` and `PlannedAction` before any mutation. | M1 | survey (`explorer_survey_1`, `spec_miner_survey_3`) |
| 6 | `FIX-03a`: Unified Auth Payload on Register & Login | Update `POST /api/auth/register` and `POST /api/auth/login` to both sign a 7-day JWT token and return `{ success: true, message, data: { token, id: user.id, email: user.email } }`. | M1 | survey (`explorer_survey_1`, `spec_miner_survey_3`) |
| 7 | `FIX-03b`: Reactive `HabitContext` Bound to `useAuthStore.token` | Subscribe `HabitProvider` (`HabitContext.tsx`) to `useAuthStore.token`: skip API requests and reset state when `token` is `null`; automatically run `loadInitialData()` when `token` becomes non-null. Fix `StartSprintScreen` & `App.tsx` retry to reload full context state. | M1 | survey (`explorer_survey_2`, `spec_miner_survey_3`) |
| 8 | `FIX-04`: Standardized JSON Envelopes & Dead Code Cleanup | Fix `"sucess"` typo in `habit.controller.ts` to `"success"`. Standardize `{ success: boolean, message?: string, data?: T }` across `day.controller.ts`, `habit.controller.ts`, and `cycleProgress.controller.ts`. Remove dead `saveDailyGoal` (`/goals`) from `frontend/src/services/api.ts` and unused interfaces from `backend/src/index.ts`. Export `app` from `backend/src/index.ts`. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`, `spec_miner_survey_3`) |
| 9 | `FEAT-01`: Edit & Delete Daily Goals + Closed-Day Lock (Issue #6) | Expand `PATCH /api/actions/:id` to update `{ description?, isCompleted? }`. Add `DELETE /api/actions/:id`. Reject any create/update/toggle/delete on a closed `DailyLog` (`isClosed === true`) with `400`. Upsert per `(logId, categoryId)` on `POST /api/actions`. Add inline click-to-edit & delete in UI. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`, `spec_miner_survey_3`) |
| 10 | `FEAT-02a`: Separate Today's Execution from Tomorrow's Proactive Plan + Day 1 Onboarding | Support `targetDate: 'today' \| 'tomorrow'` and optional `logId` in `POST /api/days` and `POST /api/actions`. Expose both `todayLog` and `tomorrowLog` in `HabitContext.tsx` using accurate calendar-date matching (`.find()` instead of `logs[logs.length - 1]`). Support setting Day 1 initial goals during sprint launch or on Day 1. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`, `spec_miner_survey_3`) |
| 11 | `FEAT-02b`: "Close Day" Gatekeeper (`PATCH /api/days/:id`) | Validate on `PATCH /api/days/:id` (`{ isClosed: true }`) that tomorrow's `DailyLog` has planned actions across all 8 core pillars (or `Math.min(8, totalCategoriesCount)`, bypassed on Day 31 or when `forceClose: true` if configured) before locking `todayLog.isClosed = true`. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`, `spec_miner_survey_3`) |
| 12 | `UI-01`: `DESIGN.md` & 4-Screen Dark UI Redesign (Issue #11) | Create `/DESIGN.md` ("Focused Obsidian & Electric Violet" dark theme, `Plus Jakarta Sans` + `JetBrains Mono` tabular numerals) and redesign: (1) Auth Split-Screen (`/login`, `/register`), (2) 31-Day Sprint Launchpad (`StartSprintScreen` with Day 1 kickoff wizard), (3) Primary Command Center (`AppLayout` collapsible rail + 31-Day progress ribbon + Unified 8-Pillar Today vs. Tomorrow Matrix without modal fatigue), (4) `/analytics` Dashboard. | M1 | survey (`explorer_survey_2`, `spec_miner_survey_3`) |
| 13 | `FEAT-03`: Live Analytics Dashboard, Sprint History Day Inspector & Day 31 Rollover | Extend `GET /api/cycle-progress/:cycleId` to return `pillarStats` (per-pillar planned/completed/rate/streak across all 8 pillars), `dailySeries` (31-day planned/completed/skipped series), `recentActivity`, `todayLog`, and `tomorrowLog`. Wire `AnalyticsDashboard.tsx` to live API data. Enable clicking any day (1..31) in the 31-Day Ribbon to inspect its actions in read-only mode, plus Day 31 completion celebration & "Start Next 31-Day Sprint" rollover. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`, `spec_miner_survey_3`) |
| 14 | `QUAL-01`: Zod Request Validation & Comprehensive Multi-Tenant / E2E Test Suite | Add `zod` validation middleware (`backend/src/middlewares/validate.ts`) for `register`, `login`, `createDay`, `updateDay`, `createAction`, `updateAction`. Build and pass automated 4-tier E2E/integration test suite against user-space PostgreSQL 15 (`backend/tests/`) + frontend TypeScript & Vite build verification. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`, `spec_miner_survey_3`) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | `M1`: Proactive 31-Day Habit Tracker MVP (Phases 1–4 & E2E Suite) | Full-stack implementation of `FIX-01`..`FIX-04`, `FEAT-01`..`FEAT-03`, `UI-01`, `QUAL-01`, `DESIGN.md`, `ROADMAP.md`, and 4-tier E2E/integration test suite | none | IN_PROGRESS |

## Interface Contracts

### `backend` ↔ `frontend` REST API (`/api`)
All responses use standard JSON envelopes `{ success: boolean, message?: string, data?: T }`. Protected routes require `Authorization: Bearer <token>` verified by `authMiddleware.ts` (attaching `req.userId`).

1. **`POST /api/auth/register` & `POST /api/auth/login`**:
   - Request: `{ email: string, password: string }` (Zod validated: valid email, non-empty password; `400` on validation failure or duplicate registration; `401` on invalid login credentials).
   - Response (`201` on register, `200` on login):
     ```json
     {
       "success": true,
       "message": "User created successfully | Login successful",
       "data": { "token": "<jwt>", "id": "<uuid>", "email": "user@example.com" }
     }
     ```
2. **`GET /api/habits`**:
   - Response (`200`): `{ "success": true, "data": HabitCategory[] }` (8 Core Pillars: `Learning`, `Physical Health`, `Nutrition`, `Mindfulness`, `Work / Focus`, `Finance`, `Organization`, `Rest`).
3. **`POST /api/cycles` (alias `POST /api/cycles/start`)**:
   - Request: `{ initialGoals?: Array<{ categoryId: string, description: string }> }` (optional).
   - Behavior: Marks any existing active cycles for `req.userId` as `isActive: false`, creates a new 31-day `Cycle` (`isActive: true`, `userId: req.userId`), auto-creates Day 1's `DailyLog` (and optional `initialGoals` on Day 1), and returns `201` `{ "success": true, "message": "Cycle started successfully", "data": Cycle }`.
4. **`GET /api/cycles` (alias `GET /api/cycles/current`) & `GET /api/cycles/history`**:
   - `GET /api/cycles` (`/current`): Queries `{ userId: req.userId, isActive: true, endDate: { gte: new Date() } }`. Returns `200` `{ "success": true, "data": Cycle | null }`.
   - `GET /api/cycles/history`: Queries all cycles for `req.userId` ordered by `startDate: 'desc'` with summary counts. Returns `200` `{ "success": true, "data": Cycle[] }`.
5. **`GET /api/cycle-progress/:cycleId`**:
   - Resolves `cycleId === 'current'` (active cycle for `req.userId`) or specific `cycleId` owned by `req.userId` (`400`/`404` `{ "success": false, "message": "..." }` if not found).
   - Returns `200`:
     ```json
     {
       "success": true,
       "stats": {
         "cycleId": "<uuid>",
         "startDate": "<iso>",
         "endDate": "<iso>",
         "isActive": true,
         "currentDayNumber": 1,
         "totalDays": 31,
         "daysLogged": 1,
         "closedDays": 0,
         "totalActions": 8,
         "completedActions": 6,
         "skippedActions": 2,
         "overallCompletionRate": 75,
         "currentStreak": 1,
         "bestStreak": 1,
         "todayPlannedCount": 8,
         "todayCompletedCount": 6,
         "tomorrowPlannedCount": 0,
         "canCloseToday": false
       },
       "logs": [ ... ],
       "todayLog": { ... },
       "tomorrowLog": null,
       "pillarStats": [
         {
           "categoryId": "<uuid>",
           "categoryName": "Learning",
           "description": "Studying, reading, and personal growth",
           "plannedCount": 1,
           "completedCount": 1,
           "skippedCount": 0,
           "completionRate": 100,
           "currentStreak": 1
         }
       ],
       "dailySeries": [
         {
           "dayNumber": 1,
           "date": "<iso>",
           "logId": "<uuid>",
           "isClosed": false,
           "isToday": true,
           "isTomorrow": false,
           "planned": 8,
           "completed": 6,
           "skipped": 2,
           "completionRate": 75
         }
       ],
       "recentActivity": [ ... ],
       "data": {
         "stats": { ... },
         "logs": [ ... ],
         "todayLog": { ... },
         "tomorrowLog": null,
         "pillarStats": [ ... ],
         "dailySeries": [ ... ],
         "recentActivity": [ ... ]
       }
     }
     ```
6. **`POST /api/days`, `GET /api/days`, `PATCH /api/days/:id`**:
   - `POST /api/days`: Accepts `{ cycleId?: string, targetDate?: 'today' | 'tomorrow' }`. Scoped by `req.userId`. Idempotent per calendar day (`00:00:00.000`–`23:59:59.999` UTC): returns `200` with existing `DailyLog` if already created for that day, or `201` with newly created `DailyLog` (including `plans`).
   - `GET /api/days`: Scoped by `req.userId` (and optional `?cycleId=`). Returns `200` `{ "success": true, "data": DailyLog[] }`.
   - `PATCH /api/days/:id`: Scoped by `req.userId` (`404` if not found/owned). When `{ isClosed: true }`, enforces the **Close Day Gatekeeper**: unless the log is Day 31 of the sprint (or `forceClose === true`), checks tomorrow's `DailyLog` for `(userId, cycleId)` and verifies that all 8 core pillars (`Math.min(8, totalCategoriesCount)`) have planned actions with non-empty descriptions. If fewer are planned, returns `400` `{ "success": false, "message": "Cannot close today until you have planned tomorrow's 8 pillars.", "data": { "plannedPillarsCount": X, "requiredPillars": 8 } }`. Otherwise updates `isClosed: true` and returns `200` `{ "success": true, "message": "Daily log updated successfully", "data": DailyLog }`.
7. **`POST /api/actions`, `PATCH /api/actions/:id`, `DELETE /api/actions/:id`**:
   - `POST /api/actions`: Accepts `{ categoryId: string, description: string, targetDate?: 'today' | 'tomorrow', logId?: string }`. Verifies `categoryId` and non-empty `description`. Resolves `logId` (verifying `userId` ownership, `404` if not owned) or finds/auto-creates the `DailyLog` for `targetDate` (`'today'` default, or `'tomorrow'`). Rejects with `400` if target `DailyLog.isClosed === true`. Upserts per `(userId, logId, categoryId)` so planning a pillar updates its goal if already present on that day, or creates a new `PlannedAction`, returning `201` `{ "success": true, "message": "Action created successfully", "data": PlannedAction }`.
   - `PATCH /api/actions/:id`: Accepts `{ description?: string, isCompleted?: boolean }`. Verifies `{ id, userId: req.userId }` (`404` if not found/owned). Rejects with `400` if parent `dailyLog.isClosed === true` or `description` is empty/whitespace. Returns `200` `{ "success": true, "message": "Action updated successfully", "data": PlannedAction }`.
   - `DELETE /api/actions/:id`: Verifies `{ id, userId: req.userId }` (`404` if not found/owned). Rejects with `400` if parent `dailyLog.isClosed === true`. Deletes and returns `200` `{ "success": true, "message": "Action deleted successfully", "data": { "id": "<uuid>" } }`.

## Code Layout
```text
/home/antigravity/GeorgeDeveloperJ/habits-tracker/
├── DESIGN.md                                  # Design System specification ("Focused Obsidian & Electric Violet")
├── ROADMAP.md                                 # Committed MVP State Analysis & Roadmap
├── PROJECT.md                                 # Global architecture, feature inventory & interface contracts
├── TEST_INFRA.md                              # E2E & integration test infrastructure spec
├── TEST_READY.md                              # Test suite readiness & coverage summary
├── docker-compose.yml                         # Docker dev orchestration (merged from origin/dev)
├── docs/
│   └── docker.md                              # Docker documentation (merged from origin/dev)
├── backend/
│   ├── Dockerfile                             # Production Dockerfile
│   ├── Dockerfile.dev                         # Development Dockerfile
│   ├── package.json                           # Express 5, Prisma 6, Zod, test script
│   ├── prisma/
│   │   ├── schema.prisma                      # Prisma schema (User, HabitCategory, Cycle, DailyLog, PlannedAction)
│   │   ├── migrations/                        # SQL migrations
│   │   └── seed.ts                            # 8 Core Pillars seeder
│   ├── scripts/
│   │   └── entrypoint.js                      # Docker dev entrypoint
│   ├── src/
│   │   ├── index.ts                           # Express app setup & export
│   │   ├── config/
│   │   │   ├── db.ts                          # Dual-compatible PrismaClient initialization
│   │   │   └── logger.ts                      # Winston logger
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.ts              # JWT Bearer verification
│   │   │   ├── cors.ts                        # CORS config
│   │   │   └── validate.ts                    # Zod validation schemas & middleware
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts             # register & login with { token, id, email }
│   │   │   ├── habit.controller.ts            # getCoreHabits ({ success: true, data })
│   │   │   ├── cycle.controller.ts            # startCycle, getCurrentCycle, getCycleHistory
│   │   │   ├── cycleProgress.controller.ts    # getCycleProgress with stats, pillarStats, dailySeries
│   │   │   ├── day.controller.ts              # createDay (idempotent), getDays, updateDay (Close Day gatekeeper)
│   │   │   └── actions.controller.ts          # createAction (today/tomorrow + upsert), updateAction, deleteAction
│   │   └── routes/
│   │       ├── auth.routes.ts
│   │       ├── habit.routes.ts
│   │       ├── cycle.routes.ts
│   │       ├── cycleProgress.routes.ts
│   │       ├── day.routes.ts
│   │       └── actions.routes.ts
│   └── tests/
│       └── e2e.test.ts                        # Comprehensive 4-tier E2E & multi-tenant test suite
└── frontend/
    ├── Dockerfile.dev
    ├── index.html                             # Loads Plus Jakarta Sans / Inter & JetBrains Mono fonts
    ├── package.json                           # React 19, Vite 8, Tailwind v4, Zustand, Axios, Recharts
    └── src/
        ├── main.tsx                           # Root mount with HabitProvider
        ├── App.tsx                            # Router (/login, /register, ProtectedRoute -> AppLayout -> /, /analytics)
        ├── index.css                          # Design system tokens & base styles
        ├── lib/
        │   └── utils.ts                       # cn() helper (clsx + tailwind-merge)
        ├── api/
        │   └── client.ts                      # Axios client with JWT request & 401 response interceptors
        ├── store/
        │   └── authStore.ts                   # Zustand persisted auth store
        ├── services/
        │   └── api.ts                         # Typed API client functions
        ├── context/
        │   └── HabitContext.tsx               # Token-reactive context exposing todayLog, tomorrowLog, selectedDayLog
        ├── components/
        │   ├── AppLayout.tsx                  # Collapsible Obsidian navigation rail & shell
        │   ├── StartSprintScreen.tsx          # Screen 2: 31-Day Sprint Launchpad & Day 1 Kickoff Wizard
        │   ├── HabitGrid.tsx                  # Screen 3: 31-Day Ribbon, Readiness Gatekeeper & Unified 8-Pillar Matrix
        │   ├── HabitCard.tsx                  # Pillar badge/card primitive
        │   ├── PlanningModal.tsx              # Optional quick-plan modal fallback
        │   ├── auth/
        │   │   ├── ProtectedRoute.tsx
        │   │   ├── Login.tsx                  # Screen 1: Auth Split-Screen (Login)
        │   │   └── Register.tsx               # Screen 1: Auth Split-Screen (Register)
        │   └── ui/
        │       ├── avatar.tsx
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── input.tsx
        │       └── table.tsx
        └── pages/
            ├── Tracker.tsx                    # Command Center page wrapper
            └── AnalyticsDashboard.tsx         # Screen 4: Live Analytics & 8-Pillar Balance Dashboard
```
