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
  - **UI Screens (`DESIGN.md` — Dual-Mode Modular Bento & Hardware Telemetry System)**:
    - **Light/Warm & Dark Modes**: Switchable via `themeStore.ts` (`proactive31-theme`). Light/Warm uses stone/alabaster (`#F4F4F2`/`#EAE9E4`), pure white (`#FFFFFF`), warm sand (`#EBE6DC`), jet black (`#121212`), acid lime (`#E6FA72`), and spring green (`#5CE68A`). Dark uses deep obsidian-violet (`#0D0914`), plum cards (`#171224`), `1px solid rgba(255,255,255,0.06)` hairline borders, orchid purple (`#D96BFF`), and warm amber (`#F5B841`). Zero drop shadows; `24px–32px` Bento radii; `12px–16px` gutters; stadium pills (`rounded-full`).
    1. **Screen 1 — Auth Split-Screen (`/login`, `/register`, `/forgot-password`, `/reset-password`)**: 2D vector 8-Pillar compass diagram with frosted-glass pill overlays (`backdrop-blur-md`), editorial `40px+` headings with inline stadium-pill icon badges, `"Forgot password?"` link on Login, and complete password recovery flow.
    2. **Screen 2 — 31-Day Sprint Launchpad (`StartSprintScreen.tsx`)**: Asymmetrical Bento layout with `DotMatrixRibbon` 31-node capsule preview, high-contrast `SegmentedBattery` readiness card, and Day 1 Pillar Kickoff wizard.
    3. **Screen 3 — Primary Command Center (`AppLayout.tsx` + `Tracker.tsx` / `HabitGrid.tsx`)**: High-contrast anchor chrome (solid floating/matte vertical pill dock + recessed top pill bar with theme toggle), asymmetrical Bento header (`DotMatrixRibbon` 31-day inspector, thick `ConcentricRing` telemetry, high-contrast Close Today `SegmentedBattery` gatekeeper), and Unified 8-Pillar Bento Matrix (Today's Execution + Tomorrow's Proactive Plan + Day 31 rollover).
    4. **Screen 4 — Analytics & Hardware Telemetry Dashboard (`/analytics`, `AnalyticsDashboard.tsx`)**: Asymmetrical Bento KPI layout with bespoke SVG/CSS `HardwareViz` visualizations (`CapsuleBarChart` with stadium bars, dashed ghost-tracks, internal indicator dots, diagonal hatch states; `SegmentedBattery` matrix; `ConcentricRing`; live breakdown & activity feed).

## Feature Inventory
Every Survey & Follow-up feature is assigned a milestone (`M1`–`M4`, none unassigned).

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
| 12 | `UI-01`: Initial `DESIGN.md` & 4-Screen Dark UI Redesign (Issue #11) | Create `/DESIGN.md` and initial 4-screen dark redesign (`bb6ddeb`). | M1 | survey (`explorer_survey_2`, `spec_miner_survey_3`) |
| 13 | `FEAT-03`: Live Analytics Dashboard, Sprint History Day Inspector & Day 31 Rollover | Extend `GET /api/cycle-progress/:cycleId` to return `pillarStats`, `dailySeries`, `recentActivity`, `todayLog`, and `tomorrowLog`. Wire `AnalyticsDashboard.tsx` to live API data, Day Inspector, and Day 31 rollover. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`, `spec_miner_survey_3`) |
| 14 | `QUAL-01`: Zod Request Validation & Comprehensive Multi-Tenant / E2E Test Suite | Add `zod` validation middleware and 40-test 4-tier E2E suite (`backend/tests/e2e.test.ts`). | M1 | survey (`explorer_survey_1`, `explorer_survey_2`, `spec_miner_survey_3`) |
| 15 | `FEAT-04`: Forgot Password & Reset Password Backend + E2E Suite | Add `PasswordResetToken` Prisma model + SQL migration, `POST /api/auth/forgot-password` & `POST /api/auth/reset-password` with SHA-256 token hashing, 15m TTL, atomic single-use claim, anti-enumeration in prod, `400` status hygiene, and Tier 1–4 E2E tests. | M2 | `ORIGINAL_REQUEST.md` Follow-up `2026-11-18T13:52:21Z`, `explorer_auth_2`, `explorer_env_3` |
| 16 | `UI-02a`: `DESIGN.md` Overhaul, Dual-Mode Tokens, UI Primitives, `HardwareViz`, Anchor Chrome, Auth/Forgot-Password & Launchpad | Update `DESIGN.md`; add `themeStore.ts` + Light/Warm & Dark CSS variables in `index.html`/`index.css`; rebuild `ui/*`, `HardwareViz.tsx`, `AppLayout.tsx`, `Login.tsx` (with `"Forgot password?"`), `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `StartSprintScreen.tsx`, `services/api.ts`, `App.tsx`. | M3 | `ORIGINAL_REQUEST.md` Follow-up `2026-11-18T13:52:21Z`, `explorer_ui_1`, `explorer_auth_2` |
| 17 | `UI-02b`: Command Center & Hardware Telemetry Analytics Rebuild + Final Whole-Project Verification | Rebuild `Tracker.tsx`, `HabitGrid.tsx`, `HabitCard.tsx`, `PlanningModal.tsx`, and `AnalyticsDashboard.tsx` (replacing Recharts with bespoke `HardwareViz` Capsule Bars, Segmented Batteries, Concentric Rings, Dot-Matrix indicators, zero shadows, `24px–32px` Bento cards, inline icon badges); verify full-stack build, lint, E2E suite, and update `TEST_READY.md`. | M4 | `ORIGINAL_REQUEST.md` Follow-up `2026-11-18T13:52:21Z`, `explorer_ui_1` |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | `M1`: Proactive 31-Day Habit Tracker MVP (Commit `bb6ddeb`) | Full-stack implementation of `FIX-01`..`FIX-04`, `FEAT-01`..`FEAT-03`, `UI-01`, `QUAL-01` | none | DONE |
| 2 | `M2`: Forgot Password Backend, Prisma Migration & E2E Tests | `FEAT-04` (`schema.prisma`, SQL migration, `validate.ts`, `auth.controller.ts`, `auth.routes.ts`, `e2e.test.ts`) | none | DONE (`52/52` E2E tests) |
| 3 | `M3`: `DESIGN.md` Overhaul, Dual-Mode Foundation, Chrome, Auth/Forgot-Password & Launchpad | `UI-02a` (`DESIGN.md`, `index.html`, `index.css`, `themeStore.ts`, `ui/*`, `HardwareViz.tsx`, `AppLayout.tsx`, `Login`/`Register`/`ForgotPassword`/`ResetPassword`, `StartSprintScreen.tsx`, `services/api.ts`, `App.tsx`) | none (uses `M2` API contract) | DONE (lint + build exit 0) |
| 4 | `M4`: Command Center & Hardware Analytics Rebuild + Final Whole-Project Verification | `UI-02b` (`Tracker.tsx`, `HabitGrid.tsx`, `HabitCard.tsx`, `PlanningModal.tsx`, `AnalyticsDashboard.tsx`, `TEST_READY.md`, whole-project build/lint/E2E/audit) | M2, M3 | DONE (`52/52` E2E, `lint` + `build` exit 0, Whole-Project Audit `CLEAN`) |

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
1b. **`POST /api/auth/forgot-password` & `POST /api/auth/reset-password`** (Public — NO `authMiddleware`, MUST NOT return `401`):
   - `POST /api/auth/forgot-password`:
     - Request: `{ email: string }` (Zod validated: trimmed non-empty valid email; `400` on invalid email).
     - Behavior: Case-insensitive lookup (`equals: email, mode: 'insensitive'`). If user exists, invalidates prior unused `PasswordResetToken` rows for `user.id`, generates 32-byte CSPRNG `rawToken`, stores SHA-256 `tokenHash` with `expiresAt` (`PASSWORD_RESET_TTL_MINUTES` or 15 min).
     - Response (`200` always for valid email format to prevent enumeration in production):
       - In non-production / test (`NODE_ENV !== 'production' || EXPOSE_RESET_TOKEN === 'true'`) when user exists: `{ "success": true, "message": "If an account with that email exists, password reset instructions have been generated.", "data": { "resetToken": "<hex>", "expiresAt": "<iso>" } }`.
       - Otherwise (production or unregistered email): `{ "success": true, "message": "If an account with that email exists, password reset instructions have been generated.", "data": null }`.
   - `POST /api/auth/reset-password`:
     - Request: `{ token: string, password: string }` (Zod validated: trimmed non-empty `token`, `password` min 6 chars; `400` on validation failure).
     - Behavior: Inside `prisma.$transaction`, looks up SHA-256 `tokenHash`, verifies `usedAt === null && expiresAt > now`, atomically claims token (`updateMany` where `usedAt: null, expiresAt: { gt: now }`), updates `User.hashedPassword` via `bcrypt.hash(password, 10)`, invalidates remaining unused tokens for user.
     - Response: `200` `{ "success": true, "message": "Password has been reset successfully. You can now sign in.", "data": null }`, or `400` `{ "success": false, "message": "Invalid or expired password reset token." }` on invalid/expired/reused token (NEVER `401`).
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
├── DESIGN.md                                  # Design System specification (Dual-Mode Modular Bento & Hardware Telemetry)
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
│   │   ├── schema.prisma                      # Prisma schema (User, PasswordResetToken, HabitCategory, Cycle, DailyLog, PlannedAction)
│   │   ├── migrations/                        # SQL migrations (including add_password_reset_tokens)
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
│   │   │   └── validate.ts                    # Zod validation schemas & middleware (incl. forgotPassword, resetPassword)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts             # register, login, forgotPassword, resetPassword
│   │   │   ├── habit.controller.ts            # getCoreHabits ({ success: true, data })
│   │   │   ├── cycle.controller.ts            # startCycle, getCurrentCycle, getCycleHistory
│   │   │   ├── cycleProgress.controller.ts    # getCycleProgress with stats, pillarStats, dailySeries
│   │   │   ├── day.controller.ts              # createDay (idempotent), getDays, updateDay (Close Day gatekeeper)
│   │   │   └── actions.controller.ts          # createAction (today/tomorrow + upsert), updateAction, deleteAction
│   │   └── routes/
│   │       ├── auth.routes.ts                 # /register, /login, /forgot-password, /reset-password
│   │       ├── habit.routes.ts
│   │       ├── cycle.routes.ts
│   │       ├── cycleProgress.routes.ts
│   │       ├── day.routes.ts
│   │       └── actions.routes.ts
│   └── tests/
│       └── e2e.test.ts                        # Comprehensive 4-tier E2E & multi-tenant test suite
└── frontend/
    ├── Dockerfile.dev
    ├── index.html                             # Loads Plus Jakarta Sans / Inter & JetBrains Mono fonts + pre-paint theme script
    ├── package.json                           # React 19, Vite 8, Tailwind v4, Zustand, Axios, Lucide
    └── src/
        ├── main.tsx                           # Root mount with HabitProvider
        ├── App.tsx                            # Router (/login, /register, /forgot-password, /reset-password, ProtectedRoute -> /, /analytics)
        ├── index.css                          # Dual-Mode Light/Warm & Dark tokens, hatch patterns, glass pills
        ├── lib/
        │   ├── pillars.ts                     # 8 Core Pillars metadata & suggestions
        │   └── utils.ts                       # cn() helper (clsx + tailwind-merge)
        ├── api/
        │   └── client.ts                      # Axios client with JWT request & 401 response interceptors
        ├── store/
        │   ├── authStore.ts                   # Zustand persisted auth store
        │   └── themeStore.ts                  # Zustand persisted Light/Warm vs Dark theme store
        ├── services/
        │   └── api.ts                         # Typed API client functions (incl. forgot/reset password)
        ├── context/
        │   └── HabitContext.tsx               # Token-reactive context exposing todayLog, tomorrowLog, selectedDayLog
        ├── components/
        │   ├── AppLayout.tsx                  # High-contrast anchor chrome (pill dock / matte sidebar + top bar + theme toggle)
        │   ├── StartSprintScreen.tsx          # Screen 2: Bento 31-Day Sprint Launchpad & Day 1 Kickoff
        │   ├── HabitGrid.tsx                  # Screen 3: Bento Header, Hardware Telemetry & Unified 8-Pillar Matrix
        │   ├── HabitCard.tsx                  # Pillar Bento card primitive
        │   ├── PlanningModal.tsx              # Flat Bento quick-plan modal fallback
        │   ├── charts/
        │   │   └── HardwareViz.tsx            # Bespoke SegmentedBattery, CapsuleBarChart, ConcentricRing, DotMatrixRibbon, PillarCompassDiagram
        │   ├── auth/
        │   │   ├── ProtectedRoute.tsx
        │   │   ├── Login.tsx                  # Screen 1: Bento Auth Split-Screen + "Forgot password?" link
        │   │   ├── Register.tsx               # Screen 1: Bento Auth Split-Screen (Register)
        │   │   ├── ForgotPassword.tsx         # Screen 1: Request Password Reset flow
        │   │   └── ResetPassword.tsx          # Screen 1: Confirm Password Reset flow
        │   └── ui/
        │       ├── avatar.tsx
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── input.tsx
        │       └── table.tsx
        └── pages/
            ├── Tracker.tsx                    # Command Center page wrapper
            └── AnalyticsDashboard.tsx         # Screen 4: Hardware Telemetry & 8-Pillar Balance Dashboard
```
