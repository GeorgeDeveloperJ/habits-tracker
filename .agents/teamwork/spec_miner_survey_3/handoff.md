# Specification & Feature Inventory Report — Proactive 31-Day Habit Tracker MVP

## 1. Observation

Direct inspection of the authoritative sources in `/home/antigravity/GeorgeDeveloperJ/habits-tracker` and `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/ef9ddef1-2ead-4945-9d35-08c3f70bc8a2/roadmap.md` yielded the following verbatim facts:

1. **Authoritative Documents & Branches**:
   - `ORIGINAL_REQUEST.md` (`/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`, lines 1–76) and `roadmap.md` (`/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/ef9ddef1-2ead-4945-9d35-08c3f70bc8a2/roadmap.md`, lines 1–163) define the 4-phase MVP roadmap (`FIX-01`..`FIX-04`, `FEAT-01`..`FEAT-03`, `UI-01`, `QUAL-01`).
   - `README.md` (lines 20–28): Defines the core product rule: *"More than just a tracker: a 31-day planning engine... It tracks 8 core pillars of your life by requiring you to define specific, actionable goals for the next day, ensuring that tomorrow's success is mapped out tonight... Proactive Planning Engine: You cannot 'close' today until you have planned actionable tasks for tomorrow's 8 pillars."*
   - Git branches (`git branch -a -v`):
     - `main` (`057527a`): Active branch with Prisma schema (`User`, `HabitCategory`, `Cycle`, `DailyLog`, `PlannedAction`), JWT auth (`authMiddleware.ts`), and React 19 + Vite 8 + Tailwind v4 frontend.
     - `origin/dev` (`e950438`, PR #10): Contains Docker dev setup (`docker-compose.yml`, `backend/Dockerfile.dev`, `backend/Dockerfile`, `backend/scripts/entrypoint.js`, `frontend/Dockerfile.dev`, `.dockerignore`, `docs/docker.md`), standard `PrismaClient()` in `backend/src/config/db.ts`, `0.0.0.0` binding in `backend/src/index.ts`, `"start": "node dist/index.js"` in `backend/package.json`, and `"dev": "vite --host"` in `frontend/package.json`.
     - `origin/frontend/dashboard` (`c4df1f7`): Contains `AppLayout.tsx`, `AnalyticsDashboard.tsx` (using `recharts`, `clsx`, `tailwind-merge`), `Tracker.tsx`, and shadcn-style UI primitives in `frontend/src/components/ui/` (`avatar.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `table.tsx`).
   - GitHub Issues (`gh issue list --state all`):
     - Issue #5 (`CLOSED`): *Implement User Authentication & Data Isolation* — requires strict per-user (`userId`) filtering across all controllers.
     - Issue #6 (`OPEN`): *Edit Text of Daily Goals* — requires updating `description` via `PATCH /api/actions/:id` with ownership check and inline/modal UI editing.
     - Issue #9 (`OPEN`): *Dockerize Development Environment* — implemented in `origin/dev` (PR #10).
     - Issue #11 (`OPEN`): *Update Frontend Design* — requires `DESIGN.md` and modern, low-friction responsive layout.

2. **Database Schema (`backend/prisma/schema.prisma`, lines 11–92 & `backend/prisma/seed.ts`, lines 6–15)**:
   - `HabitCategory`: `id` (UUID), `name` (`@unique`), `description` (`String?`), `createdAt`, `updatedAt`. Pre-seeded with 8 exact names:
     1. `'Learning'` — `'Studying, reading, and personal growth'`
     2. `'Physical Health'` — `'Exercise, training, and movement'`
     3. `'Nutrition'` — `'Eating habits, hydration, and overall wellness'`
     4. `'Mindfulness'` — `'Meditation, reflection, and mental well-being'`
     5. `'Work / Focus'` — `'Focused work sessions and productive activities'`
     6. `'Finance'` — `'Expense tracking, budgeting, and financial literacy'`
     7. `'Organization'` — `'Planning, organization, and maintaining a tidy environment'`
     8. `'Rest'` — `'Sleep quality, recovery, and digital disconnection'`
   - `Cycle`: `id` (UUID), `startDate` (`@default(now())`), `endDate` (`DateTime`), `isActive` (`@default(true)`), `userId` (`String`), `logs` (`DailyLog[]`), `createdAt`, `updatedAt`.
   - `DailyLog`: `id` (UUID), `date` (`@default(now())`), `isClosed` (`@default(false)`), `cycleId` (`String`), `userId` (`String`), `plans` (`PlannedAction[]`), `createdAt`, `updatedAt`.
   - `PlannedAction`: `id` (UUID), `description` (`String`), `isCompleted` (`@default(false)`), `logId` (`String`), `categoryId` (`String`), `userId` (`String`), `createdAt`, `updatedAt`.
   - `User`: `id` (UUID), `email` (`@unique`), `hashedPassword` (`String`), `createdAt`, `updatedAt`.

3. **Existing Backend Implementation & Defects**:
   - `backend/src/controllers/auth.controller.ts` (lines 7–83):
     - `register` (line 28–32) returns `{ success: true, message: 'User created succesfully', data: { id: user.id, email: user.email } }` — omits `token`.
     - `login` (line 70–74) returns `{ success: true, message: 'Login succesful', data: { token, email } }` — omits `id: user.id`.
   - `backend/src/controllers/habit.controller.ts` (lines 5–20):
     - Returns `{ sucess: true, data: habits }` (typo `"sucess"` on lines 9 and 15).
   - `backend/src/controllers/cycle.controller.ts` (lines 5–50):
     - `startCycle` (lines 14–19) creates a new cycle without deactivating prior active cycles for `userId`.
     - `getCurrentCycle` (line 37) runs `prisma.cycle.findFirst()` with no `where` clause (leaks other users' cycles and expired cycles).
   - `backend/src/controllers/cycleProgress.controller.ts` (lines 5–58):
     - `getCycleProgress` (lines 7–10) queries `prisma.cycle.findFirst({ where: { endDate: { gte: new Date() } } })` without `userId: req.userId` and ignores `req.params.cycleId`.
     - Error responses (lines 13, 56) omit `success: false`.
   - `backend/src/controllers/day.controller.ts` (lines 5–74):
     - `createDay` (lines 12–29) queries `activeCycle` without `userId`, creates duplicate `DailyLog` entries on every call (not idempotent per day), and returns raw `day` instead of `{ success: true, data: day }`.
     - `getDays` (lines 37–45) runs `prisma.dailyLog.findMany()` across all users and returns raw `days`.
     - `updateDay` (lines 47–73) updates `DailyLog` by `id` without checking `userId` ownership or validating tomorrow's planned actions before setting `isClosed = true`, and returns raw `day`.
   - `backend/src/controllers/actions.controller.ts` (lines 5–71):
     - `createAction` (lines 14–16) attaches new action to `prisma.dailyLog.findFirst({ orderBy: { createdAt: 'desc' } })` globally without `userId` or target date/log resolution.
     - `toggleActionStatus` (lines 48–63) updates `PlannedAction` by `id` without checking `userId` ownership or `!dailyLog.isClosed`, and only updates `isCompleted` (ignoring `description`).
     - No `DELETE /api/actions/:id` route or handler exists.

4. **Existing Frontend Implementation & Contract Expectations**:
   - `frontend/src/components/auth/Login.tsx` (lines 22–26):
     - Calls `apiClient.post('/auth/login', { email, password })` and expects `response.data.success === true` and `const { token, id, email: userEmail } = response.data.data;`.
   - `frontend/src/components/auth/Register.tsx` (lines 23–34):
     - Calls `apiClient.post('/auth/register', { email, password })` and checks `if (response.data.data && response.data.data.token)` to extract `{ token, id, email: userEmail }` and auto-login via `useAuthStore.login(token, { id, email })`.
   - `frontend/src/services/api.ts` (lines 59–144):
     - `fetchHabitCategories`: `GET /habits` -> `response.data?.data || []`
     - `fetchActiveCycle`: `GET /cycles` -> `response.data?.data || null`
     - `startNewCycle`: `POST /cycles` -> `response.data?.data`
     - `createDailyLog`: `POST /days` -> `response.data?.data`
     - `toggleDailyLogStatus`: `PATCH /days/${dayId}` -> `response.data?.data`
     - `fetchCycleProgress`: `GET /cycle-progress/current` -> `{ stats: response.data?.stats, logs: response.data?.logs || [] }`
     - `createAction`: `POST /actions` -> `response.data?.data`
     - `toggleActionStatus`: `PATCH /actions/${actionId}` -> `response.data?.data`
   - `frontend/src/context/HabitContext.tsx` (lines 104–106):
     - `useEffect(() => { loadInitialData(); }, []);` runs only once on initial mount and never subscribes to `useAuthStore((s) => s.token)`.

---

## 2. Logic Chain

1. **Multi-Tenancy & Data Isolation (`FIX-02`)**: Because `Prisma` models `Cycle`, `DailyLog`, and `PlannedAction` all have `userId` foreign keys (`backend/prisma/schema.prisma`, lines 33, 52, 71) and `authMiddleware.ts` (line 26) populates `req.userId`, every controller query on `Cycle`, `DailyLog`, and `PlannedAction` must scope `where` clauses by `userId: req.userId`. Attempting to access or mutate another user's resource by ID must return `404 Not Found` (or `403 Forbidden`).
2. **Auth Payload & Context Reactivity (`FIX-03`)**: Because `Login.tsx` (line 24) and `Register.tsx` (line 27) destructure `{ token, id, email }` from `response.data.data`, both `POST /api/auth/register` and `POST /api/auth/login` must return `{ success: true, message, data: { token, id: user.id, email: user.email } }`. Because `HabitProvider` mounts at application startup (`main.tsx`, line 9) before login, `HabitContext.tsx` must subscribe to `useAuthStore((state) => state.token)`: when `token` is `null`, reset state and set `loading = false`; when `token` becomes non-null, call `loadInitialData()`.
3. **API Envelope & Route Alias Alignment (`FIX-04`)**:
   - `frontend/src/services/api.ts` unwraps `response.data?.data` for `/habits`, `/cycles`, `/days`, and `/actions`, while `fetchCycleProgress` reads `response.data?.stats` and `response.data?.logs`.
   - Returning `{ success: true, data: ... }` across all endpoints—and for `GET /api/cycle-progress/:cycleId`, returning `{ success: true, stats, logs, pillarStats, dailySeries, data: { stats, logs, pillarStats, dailySeries } }`—satisfies both existing `api.ts` callers and strict `{ success, data }` envelope consumers.
   - Supporting both `POST /api/cycles` + `POST /api/cycles/start` and `GET /api/cycles` + `GET /api/cycles/current` on `cycle.routes.ts` ensures 100% compatibility with both `api.ts` (`/cycles`) and external callers/tests (`/cycles/start`, `/cycles/current`).
4. **Proactive Today vs. Tomorrow Engine & Close Day Gatekeeper (`FEAT-01`, `FEAT-02`)**:
   - The core product loop requires distinguishing **Today's Execution Log** from **Tomorrow's Proactive Plan Log**.
   - `POST /api/days` and `POST /api/actions` must accept `targetDate?: 'today' | 'tomorrow'` (and `logId?: string` on `POST /api/actions`), resolving calendar day boundaries (`00:00:00.000` to `23:59:59.999` UTC/local day) idempotently so at most one `DailyLog` per user per cycle per calendar date is created.
   - When `dailyLog.isClosed === true`, any attempt to create, edit, toggle, or delete a `PlannedAction` belonging to that `DailyLog` must be rejected with `400 Bad Request`.
   - When closing today (`PATCH /api/days/:id` with `{ isClosed: true }`), the backend must verify ownership (`userId`), and unless the current day is Day 31 of the sprint (or `skipTomorrowCheck` is not applicable), verify that tomorrow's `DailyLog` has planned actions (all 8 core pillars planned for tomorrow, or configurable threshold; see exact contract in Section 4) before setting `isClosed = true`.
5. **UI/UX Redesign (`UI-01`) & Live Analytics (`FEAT-03`)**:
   - Establishing `DESIGN.md` ("Focused Obsidian & Electric Violet" dark-first system) and integrating the collapsible `AppLayout` sidebar, unified Today vs. Tomorrow 8-Pillar Matrix (eliminating 24-click modal fatigue), 31-Day interactive progress ribbon with Day Inspector, and `AnalyticsDashboard` wired to live `pillarStats` and `dailySeries` from `GET /api/cycle-progress/:cycleId` fulfills Issues #6 and #11 and Phases 3–4.

---

## 3. Exhaustive Feature Inventory & Edge Cases

## Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | `FIX-01` (Infra / Docker & DB) | Merge `origin/dev` Docker & Standard Prisma Setup | Consolidate `docker-compose.yml`, `backend/Dockerfile.dev`, `backend/Dockerfile`, `backend/scripts/entrypoint.js`, `frontend/Dockerfile.dev`, `.dockerignore`, `docs/docker.md`, `0.0.0.0` server binding, `package.json` `"main": "dist/index.js"` & `"start": "node dist/index.js"`, Vite `--host`, and standard `PrismaClient` in `backend/src/config/db.ts` (Closes Issue #9). | `DATABASE_URL`, `PORT`, `JWT_SECRET`, `VITE_API_URL` env vars | Running Express API on `0.0.0.0:3000` & Vite on `0.0.0.0:5173`; compiled `dist/index.js` | Throws error on startup if `DATABASE_URL` is missing | `roadmap.md` §1.1, `origin/dev` (`e950438`), Issue #9, PR #10 |
| 2 | `FIX-02` (Security / Multi-Tenancy) | User-Scoped Cycle Management | Scope `startCycle` (`POST /api/cycles` & `/api/cycles/start`) and `getCurrentCycle` (`GET /api/cycles` & `/api/cycles/current`) by `req.userId`. Deactivate any prior active cycles (`updateMany({ where: { userId, isActive: true }, data: { isActive: false } })`) before creating a new 31-day cycle. Auto-expire or filter out cycles where `endDate < now`. | Authenticated `req.userId` (from Bearer JWT) | `200/201` `{ success: true, data: Cycle \| null }` | `401 Unauthorized` if missing/invalid JWT; `500` on DB error | `roadmap.md` §1.2, `cycle.controller.ts`, Issue #5 |
| 3 | `FIX-02` (Security / Multi-Tenancy) | User-Scoped & Parameter-Aware Cycle Progress | Scope `GET /api/cycle-progress/:cycleId` by `userId: req.userId`. If `:cycleId === 'current'`, query user's active cycle (`isActive: true, endDate: { gte: now }`); if `:cycleId` is a UUID, query `{ id: cycleId, userId }`. Scope `dailyLog.findMany` by `{ cycleId: cycle.id, userId }`. | `req.params.cycleId` (`'current'` or UUID), `req.userId` | `200 OK` `{ success: true, stats, logs, pillarStats, dailySeries, data: { stats, logs, pillarStats, dailySeries } }` | `401` if unauthenticated; `404` / `400` `{ success: false, message }` if no matching/active cycle for user | `roadmap.md` §1.2 & §4.1, `cycleProgress.controller.ts` |
| 4 | `FIX-02` (Security / Multi-Tenancy) | User-Scoped & Idempotent Daily Logs | Scope `POST /api/days`, `GET /api/days`, and `PATCH /api/days/:id` by `userId: req.userId`. Make `POST /api/days` idempotent per calendar day (`targetDate: 'today' \| 'tomorrow'`) within the user's active cycle so repeated calls/refreshes return the existing `DailyLog` (including `plans`) instead of creating duplicates. | `POST /api/days` `{ cycleId?, targetDate?: 'today' \| 'tomorrow' }`, `GET /api/days`, `PATCH /api/days/:id` `{ isClosed }` | `200/201` `{ success: true, data: DailyLog \| DailyLog[] }` | `400` if no active cycle; `401` if unauthenticated; `404` if `:id` not found or owned by another user | `roadmap.md` §1.2, `day.controller.ts`, Issue #5 |
| 5 | `FIX-02` (Security / Multi-Tenancy) | User-Scoped Planned Actions | Scope `POST /api/actions`, `PATCH /api/actions/:id`, and `DELETE /api/actions/:id` by `userId: req.userId`. Verify ownership of both target `DailyLog` and `PlannedAction` before any read/write/delete. | `req.userId`, action payload / `:id` | `200/201` `{ success: true, message, data: PlannedAction }` | `401` if unauthenticated; `404` if action/log belongs to another user or does not exist | `roadmap.md` §1.2, `actions.controller.ts`, Issue #5 |
| 6 | `FIX-03` (Auth & State Lifecycle) | Unified Auth Response Payload & Immediate Registration Login | Update `POST /api/auth/register` and `POST /api/auth/login` to both generate a 7-day JWT token (`sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })`) and return `{ success: true, message, data: { token, id: user.id, email: user.email } }`. | `{ email, password }` | `201` (register) / `200` (login) `{ success: true, message, data: { token, id, email } }` | `400` missing/invalid email or password or duplicate email; `401` invalid credentials | `roadmap.md` §1.3, `auth.controller.ts`, `Login.tsx`, `Register.tsx` |
| 7 | `FIX-03` (Auth & State Lifecycle) | Reactive `HabitContext` Bound to `useAuthStore.token` | Subscribe `HabitProvider` (`HabitContext.tsx`) to `useAuthStore((state) => state.token)`. Skip API calls and clear `activeCycle`, `progress`, `todayLog`, `tomorrowLog`, `error` when `token` is `null`; automatically run `loadInitialData()` whenever `token` transitions to a valid JWT string. | `token` state from `useAuthStore` | Hydrated `HabitContext` state on login/register; clean reset on logout | Sets `error` message only when authenticated fetch fails; auto-logouts on `401` via Axios interceptor | `roadmap.md` §1.3, `HabitContext.tsx`, `authStore.ts` |
| 8 | `FIX-04` (API Contracts & Cleanup) | Standardized JSON Envelopes & Dead Code Removal | Fix `"sucess"` typo in `habit.controller.ts` to `"success": true`. Wrap `day.controller.ts` responses in `{ success: true, data: ... }`. Add `"success": false` to error responses in `cycleProgress.controller.ts` and `day.controller.ts`. Remove dead `saveDailyGoal` (`/goals`) from `frontend/src/services/api.ts` and unused interfaces from `backend/src/index.ts`. | All API requests | Consistent `{ success: boolean, message?: string, data?: T }` JSON envelopes | Consistent `{ success: false, message: string, errors?: ... }` on `4xx/5xx` | `roadmap.md` §1.4, `habit.controller.ts`, `day.controller.ts`, `api.ts`, `index.ts` |
| 9 | `FEAT-01` (Goal CRUD — Issue #6) | Edit & Delete Planned Actions + Closed-Day Lock Enforcement | Expand `PATCH /api/actions/:id` to update `{ description?, isCompleted? }`. Add `DELETE /api/actions/:id` to delete a planned action. Enforce ownership (`userId`) and reject mutations (`400 Bad Request`) if parent `dailyLog.isClosed === true`. Prevent duplicate actions for the same `(logId, categoryId)` by updating/upserting or replacing on `POST /api/actions`. | `PATCH /api/actions/:id` `{ description?, isCompleted? }`; `DELETE /api/actions/:id` | `200 OK` `{ success: true, message, data: PlannedAction \| { id } }` | `400` if `dailyLog.isClosed === true` or empty `description`; `404` if not found / wrong `userId` | `roadmap.md` §2.1, Issue #6, `actions.controller.ts` |
| 10 | `FEAT-02` (Proactive Engine) | Today's Execution vs. Tomorrow's Proactive Plan Separation + Day 1 Onboarding | Support `targetDate: 'today' \| 'tomorrow'` and optional `logId` in `POST /api/days` and `POST /api/actions`. Expose both `todayLog` and `tomorrowLog` in `HabitContext.tsx`. Allow Day 1 Sprint Kickoff to populate Day 1's initial goals immediately so new sprints start with actionable goals on Day 1. | `targetDate: 'today' \| 'tomorrow'`, `categoryId`, `description`, `logId?` | Separate `DailyLog` records for today (`date = today`) and tomorrow (`date = tomorrow`), each with up to 8 `PlannedAction` items | `400` if target log is already closed or `categoryId` invalid | `roadmap.md` §2.2, `README.md`, `HabitContext.tsx`, `HabitGrid.tsx` |
| 11 | `FEAT-02` (Proactive Engine) | "Close Day" Gatekeeper (`PATCH /api/days/:id`) | Closing today's log (`PATCH /api/days/:id` with `{ isClosed: true }`) verifies that the user has planned tomorrow's actions across the 8 core pillars (or configured minimum; bypassed on Day 31 of the cycle). Once closed, `todayLog.isClosed` is `true` and today's actions become read-only/locked. | `PATCH /api/days/:id` `{ isClosed: true }` | `200 OK` `{ success: true, message: 'Day closed successfully', data: DailyLog }` | `400 Bad Request` `{ success: false, message: 'Cannot close today until tomorrow is planned...' }` if tomorrow's pillars are incomplete; `404` if log not owned by user | `roadmap.md` §2.3, `README.md` line 27, `day.controller.ts` |
| 12 | `UI-01` (Design System & Screens — Issue #11) | `DESIGN.md` & Stitch-Guided 4-Screen Dark UI Redesign | Create `DESIGN.md` ("Focused Obsidian & Electric Violet": `#0B0D13` canvas, `#12151E` surface, `#1E2330` border, `#8B5CF6` violet, `#10B981` emerald, `#F59E0B` amber) and implement: (1) Auth Split-Screen (`/login`, `/register`), (2) 31-Day Sprint Launchpad (`StartSprintScreen` with Day 1 kickoff), (3) Primary Command Center (`AppLayout` + 31-Day Progress Ribbon + Unified 8-Pillar Today Execution & Tomorrow Inline Planning Matrix + Close Day Gatekeeper), (4) Analytics Dashboard (`/analytics`). | User interactions across `/login`, `/register`, `/`, `/analytics` | Responsive, accessible dark UI without modal fatigue; inline goal creation/editing/deletion | Inline validation & toast/banner feedback on API errors or incomplete tomorrow plan | `roadmap.md` §3.1–3.2, Issue #11, `origin/frontend/dashboard` |
| 13 | `FEAT-03` (Analytics & History) | Live Analytics Dashboard, Sprint History Day Inspector & Day 31 Rollover | Wire `AnalyticsDashboard.tsx` (`/analytics`) to real data from `GET /api/cycle-progress/:cycleId` (`pillarStats` per-pillar completion rates across the 8 pillars, `dailySeries` 31-day planned vs. completed trend, streak & summary cards). Enable clicking any day (1..31) in the 31-Day Progress Ribbon to inspect its actions in read-only mode. Handle Day 31 completion celebration & "Start Next 31-Day Sprint" rollover. | `GET /api/cycle-progress/current`, day pill click (`dayNumber` 1..31) | Live Recharts visualizations, 8-pillar breakdown table, read-only past day inspector, Day 31 rollover CTA | Empty-state handling when 0 logs/actions exist (`overallCompletionRate = 0`, 0% pillar rates without `NaN`) | `roadmap.md` §4.1–4.2, `origin/frontend/dashboard` |
| 14 | `QUAL-01` (Validation & Testing) | Zod Request Validation & Multi-Tenant Integration Test Suite | Add `zod` validation schemas/middleware for `register`, `login`, `createDay`, `updateDay`, `createAction`, `updateAction`. Add automated integration/API tests verifying auth, multi-tenant isolation (User A cannot read/mutate User B's cycle, log, or action), Close Day gatekeeping, and Today/Tomorrow action lifecycle. | HTTP requests to `/api/*` | Validated controller inputs; `400 Bad Request` on invalid payloads; passing test suite | Returns `400 Bad Request` `{ success: false, message, errors }` on schema violation | `roadmap.md` §4.3 |

---

## Edge Cases
| # | Feature | Input | Observed / Required Behavior |
|---|---------|-------|------------------------------|
| 1 | `POST /api/auth/register` | Duplicate email (`user@example.com` already exists) or invalid email format / empty password | Returns `400 Bad Request` with `{ success: false, message: 'User already exists.' }` (or validation error message). Never leaks password hashes. |
| 2 | `POST /api/auth/login` | Non-existent email or wrong password | Returns `401 Unauthorized` with `{ success: false, message: 'Invalid credentials' }`. |
| 3 | Protected Routes (`/api/habits`, `/api/cycles`, `/api/days`, `/api/actions`, `/api/cycle-progress`) | Missing `Authorization` header, malformed header (not `Bearer <token>`), or expired/tampered JWT | `authMiddleware` returns `401 Unauthorized` `{ success: false, message: 'Access denied' \| 'Invalid or expired token.' }`. Frontend Axios interceptor catches `401` and calls `useAuthStore.getState().logout()`. |
| 4 | Multi-Tenant Isolation (`PATCH /api/days/:id`, `PATCH /api/actions/:id`, `DELETE /api/actions/:id`, `GET /api/cycle-progress/:cycleId`) | Authenticated User A passes a valid UUID belonging to User B | Query scoped by `userId: req.userId` finds no record and returns `404 Not Found` (or `403 Forbidden`) `{ success: false, message: '...' }`. User B's record remains untouched. |
| 5 | `POST /api/cycles` (Start Cycle) | User already has an `isActive: true` cycle and starts a new cycle | Prior active cycle(s) for `req.userId` are atomically updated to `isActive: false` before the new 31-day cycle is created with `isActive: true`. Other users' active cycles are unaffected. |
| 6 | `GET /api/cycles` (Current Cycle) | User has an `isActive: true` cycle whose `endDate` is in the past (`endDate < new Date()`) | Query filters by `{ userId: req.userId, isActive: true, endDate: { gte: new Date() } }` (and optionally marks expired cycle `isActive: false`), returning `data: null` so frontend shows Sprint Completion / Start New Sprint screen. |
| 7 | `POST /api/days` (Idempotency) | Frontend refreshes 5 times on the same calendar day (`targetDate: 'today'`) or plans multiple pillars for `'tomorrow'` | Returns the existing `DailyLog` for `(userId, activeCycle.id, calendarDay)` instead of creating duplicate `DailyLog` rows. |
| 8 | `POST /api/actions` (Same Pillar Re-plan) | User submits a new goal for a `categoryId` that already has a `PlannedAction` in the target `DailyLog` (and `!dailyLog.isClosed`) | Updates the existing `PlannedAction` for `(logId, categoryId)` (or replaces it) rather than creating duplicate goals for the same pillar on the same day. |
| 9 | Closed Day Immutability (`POST /api/actions`, `PATCH /api/actions/:id`, `DELETE /api/actions/:id`) | User tries to add, edit `description`, toggle `isCompleted`, or delete an action belonging to a `DailyLog` where `isClosed === true` | Backend rejects with `400 Bad Request` `{ success: false, message: 'Cannot modify actions of a closed daily log.' }`. |
| 10 | Close Day Gatekeeper (`PATCH /api/days/:id` with `{ isClosed: true }`) | User attempts to close today's `DailyLog` when tomorrow's `DailyLog` has fewer than the required planned pillars (e.g., 0/8 or <8 pillars planned) on Days 1–30 | Backend rejects with `400 Bad Request` `{ success: false, message: 'You must plan tomorrow\'s 8 pillars before closing today.' }` (unless it is Day 31 of the cycle or `force`/`minPillars` rule is satisfied). |
| 11 | Close Day on Day 31 | User is on Day 31 (final day of the sprint) and closes today's `DailyLog` | Succeeds without requiring Day 32 ("tomorrow") to be planned, marks `todayLog.isClosed = true`, and allows sprint completion celebration / rollover. |
| 12 | `GET /api/cycle-progress/:cycleId` with Zero Actions | Brand new cycle with 0 logged days or 0 planned actions | Returns `overallCompletionRate: 0`, `completedActions: 0`, `daysLogged: 0` (or `1`), and `pillarStats` with `0%` completion rates—never `NaN` or division-by-zero errors. |

---

## 4. Exact Backend ↔ Frontend API Contracts

### 4.1 Authentication Endpoints

#### `POST /api/auth/register`
- **Auth Required**: No
- **Request Body** (validated via Zod):
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
  - `email`: valid email string (trimmed, lowercased or exact match)
  - `password`: non-empty string (min 6 characters recommended, or non-empty string for backward compatibility with existing tests)
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "id": "e7b049d9-7158-49c7-876a-3507c30932bb",
      "email": "user@example.com"
    }
  }
  ```
  - **Frontend Match**: `Register.tsx` (lines 24–30) checks `if (response.data && response.data.success)` and `if (response.data.data && response.data.data.token)`, extracts `{ token, id, email: userEmail } = response.data.data`, calls `useAuthStore.login(token, { id, email })`, and navigates directly to `'/'`.
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "message": "Email and password are required." }` or `{ "success": false, "message": "User already exists." }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Error registering" }`

#### `POST /api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "id": "e7b049d9-7158-49c7-876a-3507c30932bb",
      "email": "user@example.com"
    }
  }
  ```
  - **Frontend Match**: `Login.tsx` (lines 23–26) checks `if (response.data && response.data.success)`, destructures `const { token, id, email: userEmail } = response.data.data;`, calls `login(token, { id, email: userEmail })`, and navigates to `'/'`.
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "message": "Email and password are required." }`
  - `401 Unauthorized`: `{ "success": false, "message": "Invalid credentials" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Error logging in" }`

---

### 4.2 Habit Categories (The 8 Core Pillars)

#### `GET /api/habits`
- **Auth Required**: Yes (`authMiddleware` — `Authorization: Bearer <token>`)
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "<uuid>",
        "name": "Learning",
        "description": "Studying, reading, and personal growth",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      },
      {
        "id": "<uuid>",
        "name": "Physical Health",
        "description": "Exercise, training, and movement",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      },
      {
        "id": "<uuid>",
        "name": "Nutrition",
        "description": "Eating habits, hydration, and overall wellness",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      },
      {
        "id": "<uuid>",
        "name": "Mindfulness",
        "description": "Meditation, reflection, and mental well-being",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      },
      {
        "id": "<uuid>",
        "name": "Work / Focus",
        "description": "Focused work sessions and productive activities",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      },
      {
        "id": "<uuid>",
        "name": "Finance",
        "description": "Expense tracking, budgeting, and financial literacy",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      },
      {
        "id": "<uuid>",
        "name": "Organization",
        "description": "Planning, organization, and maintaining a tidy environment",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      },
      {
        "id": "<uuid>",
        "name": "Rest",
        "description": "Sleep quality, recovery, and digital disconnection",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      }
    ]
  }
  ```
  - **Note**: Fixes the `"sucess": true` typo in `habit.controller.ts` to `"success": true`.
  - **Frontend Match**: `fetchHabitCategories()` in `api.ts` returns `response.data?.data || []`.

---

### 4.3 Cycles (31-Day Sprints)

> **Route Alias Requirement**: `frontend/src/services/api.ts` calls `POST /api/cycles` and `GET /api/cycles`, while specification/test callers may also invoke `POST /api/cycles/start` and `GET /api/cycles/current`. `backend/src/routes/cycle.routes.ts` MUST mount both:
> - `router.post('/', authMiddleware, startCycle)` AND `router.post('/start', authMiddleware, startCycle)`
> - `router.get('/', authMiddleware, getCurrentCycle)` AND `router.get('/current', authMiddleware, getCurrentCycle)`

#### `POST /api/cycles` (and `POST /api/cycles/start`)
- **Auth Required**: Yes (`req.userId`)
- **Request Body**: Optional `{ initialGoals?: Array<{ categoryId: string, description: string }> }` (for Day 1 Kickoff wizard, or empty body `{}`)
- **Behavior**:
  1. Deactivate all existing active cycles for `req.userId`:
     `await prisma.cycle.updateMany({ where: { userId, isActive: true }, data: { isActive: false } })`
  2. Create new cycle with `startDate = new Date()`, `endDate = new Date(date.getTime() + 31 * 24 * 60 * 60 * 1000)`, `isActive = true`, `userId`.
  3. Automatically create (or upsert) Day 1's `DailyLog` (`date = startDate`, `cycleId = cycle.id`, `userId`). If `initialGoals` are provided in body, create the corresponding `PlannedAction` records on Day 1's `DailyLog`.
- **Success Response (`200 OK` or `201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Cycle started successfully",
    "data": {
      "id": "<uuid>",
      "startDate": "2026-06-06T13:24:49.000Z",
      "endDate": "2026-07-07T13:24:49.000Z",
      "isActive": true,
      "userId": "<uuid>",
      "createdAt": "2026-06-06T13:24:49.000Z",
      "updatedAt": "2026-06-06T13:24:49.000Z"
    }
  }
  ```

#### `GET /api/cycles` (and `GET /api/cycles/current`)
- **Auth Required**: Yes (`req.userId`)
- **Behavior**:
  1. Query active, non-expired cycle for `req.userId`:
     ```ts
     const cycle = await prisma.cycle.findFirst({
       where: {
         userId: req.userId,
         isActive: true,
         endDate: { gte: new Date() }
       },
       orderBy: { createdAt: 'desc' }
     });
     ```
  2. Returns `data: cycle` (`Cycle` object if active cycle exists, or `null` if none).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "<uuid>",
      "startDate": "2026-06-06T13:24:49.000Z",
      "endDate": "2026-07-07T13:24:49.000Z",
      "isActive": true,
      "userId": "<uuid>",
      "createdAt": "2026-06-06T13:24:49.000Z",
      "updatedAt": "2026-06-06T13:24:49.000Z"
    }
  }
  ```

---

### 4.4 Cycle Progress & Analytics

#### `GET /api/cycle-progress/:cycleId`
- **Auth Required**: Yes (`req.userId`)
- **URL Parameters**:
  - `cycleId`: `'current'` OR a specific cycle UUID.
- **Behavior**:
  1. If `cycleId === 'current'`, find `prisma.cycle.findFirst({ where: { userId: req.userId, isActive: true, endDate: { gte: new Date() } }, orderBy: { createdAt: 'desc' } })`.
  2. Otherwise, find `prisma.cycle.findFirst({ where: { id: cycleId, userId: req.userId } })`.
  3. If no cycle is found, return `400` (when `'current'`) or `404` (when specific UUID not found) with `{ success: false, message: 'No active cycle found to calculate stats.' }`.
  4. Fetch `logs` for `{ cycleId: cycle.id, userId: req.userId }` with `include: { plans: { include: { category: true } } }, orderBy: { date: 'asc' }`.
  5. Compute:
     - `currentDayNumber`: `Math.min(31, Math.max(1, Math.floor((Date.now() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1))` (consistent 1-based day index 1..31).
     - `daysLogged`: count of logs up to today (or `logs.length`).
     - `totalActions`: total `PlannedAction` count across logs.
     - `completedActions`: count of `PlannedAction` where `isCompleted === true`.
     - `overallCompletionRate`: `totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0`.
     - `pillarStats`: Array of 8 objects (one per `HabitCategory`):
       ```ts
       {
         categoryId: string;
         categoryName: string;
         plannedCount: number;
         completedCount: number;
         completionRate: number; // 0..100
         currentStreak: number;
       }
       ```
     - `dailySeries`: Array of daily summary entries across the cycle logs:
       ```ts
       {
         dayNumber: number; // 1..31
         date: string;      // ISO date string
         logId: string | null;
         isClosed: boolean;
         planned: number;
         completed: number;
         skipped: number;
         completionRate: number;
       }
       ```
- **Success Response (`200 OK`)**:
  *(Includes top-level `stats`, `logs`, `pillarStats`, `dailySeries` AND nested `data: { stats, logs, pillarStats, dailySeries }` so both `response.data.stats` in `api.ts` and `response.data.data` consumers work without breaking!)*
  ```json
  {
    "success": true,
    "stats": {
      "cycleId": "<uuid>",
      "currentDayNumber": 1,
      "daysLogged": 1,
      "totalActions": 8,
      "completedActions": 6,
      "overallCompletionRate": 75
    },
    "logs": [
      {
        "id": "<uuid>",
        "date": "2026-06-06T13:24:49.000Z",
        "isClosed": false,
        "cycleId": "<uuid>",
        "userId": "<uuid>",
        "plans": []
      }
    ],
    "pillarStats": [
      {
        "categoryId": "<uuid>",
        "categoryName": "Learning",
        "plannedCount": 1,
        "completedCount": 1,
        "completionRate": 100,
        "currentStreak": 1
      }
    ],
    "dailySeries": [
      {
        "dayNumber": 1,
        "date": "2026-06-06T13:24:49.000Z",
        "logId": "<uuid>",
        "isClosed": false,
        "planned": 8,
        "completed": 6,
        "skipped": 2,
        "completionRate": 75
      }
    ],
    "data": {
      "stats": { "...": "..." },
      "logs": [ "..." ],
      "pillarStats": [ "..." ],
      "dailySeries": [ "..." ]
    }
  }
  ```

---

### 4.5 Daily Logs (`POST /api/days`, `GET /api/days`, `PATCH /api/days/:id`)

#### `POST /api/days`
- **Auth Required**: Yes (`req.userId`)
- **Request Body**:
  ```json
  {
    "cycleId": "<optional-uuid>",
    "targetDate": "today"
  }
  ```
  - `targetDate`: `'today' | 'tomorrow'` (optional, defaults to `'today'`).
- **Behavior**:
  1. Resolve the user's active cycle (`where: { userId: req.userId, isActive: true, endDate: { gte: new Date() } }`, or matching `cycleId` owned by `req.userId`). If none, return `400 Bad Request` `{ success: false, message: 'No active cycle found' }`.
  2. Compute the target calendar date (`today` or `today + 1 day` if `targetDate === 'tomorrow'`), and its `[startOfDay, endOfDay]` bounds (`00:00:00.000` to `23:59:59.999`).
  3. **Idempotency Check**: Query `prisma.dailyLog.findFirst({ where: { userId: req.userId, cycleId: activeCycle.id, date: { gte: startOfDay, lte: endOfDay } }, include: { plans: true } })`.
  4. If found, return `200 OK` `{ success: true, data: existingDay }`.
  5. If not found, create `prisma.dailyLog.create({ data: { userId: req.userId, cycleId: activeCycle.id, date: targetDateObj }, include: { plans: true } })` and return `201 Created` `{ success: true, data: newDay }`.

#### `GET /api/days`
- **Auth Required**: Yes (`req.userId`)
- **Query Params**: Optional `?cycleId=<uuid>`
- **Behavior**:
  - Fetch `prisma.dailyLog.findMany({ where: { userId: req.userId, ...(cycleId ? { cycleId } : {}) }, include: { plans: true }, orderBy: { date: 'asc' } })`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "<uuid>",
        "date": "2026-06-06T13:24:49.000Z",
        "isClosed": false,
        "cycleId": "<uuid>",
        "userId": "<uuid>",
        "plans": []
      }
    ]
  }
  ```

#### `PATCH /api/days/:id` (Close Day Gatekeeper)
- **Auth Required**: Yes (`req.userId`)
- **URL Parameters**: `id` (UUID of the `DailyLog`)
- **Request Body**:
  ```json
  {
    "isClosed": true
  }
  ```
- **Behavior**:
  1. Verify the `DailyLog` exists and is owned by `req.userId`:
     `const dayLog = await prisma.dailyLog.findFirst({ where: { id, userId: req.userId }, include: { cycle: true, plans: true } })`.
     If not found, return `404 Not Found` `{ success: false, message: 'Daily log not found' }`.
  2. Protected fields (`id`, `date`, `cycleId`, `userId`) cannot be modified.
  3. **Close Day Validation (`isClosed === true`)**:
     - Calculate whether `dayLog` is before Day 31 of `dayLog.cycle`.
     - Look up tomorrow's `DailyLog` for `(req.userId, dayLog.cycleId)` within tomorrow's `[startOfTomorrow, endOfTomorrow]` window (with `include: { plans: true }`).
     - Count distinct planned `categoryId`s with non-empty `description` in tomorrow's `DailyLog`.
     - If on Days 1–30 and tomorrow's planned pillars count is `< 8` (or `< requiredPillars` where total seeded categories is `Math.min(8, totalCategoriesInDb)`), return `400 Bad Request`:
       ```json
       {
         "success": false,
         "message": "Cannot close today until you have planned tomorrow's 8 pillars.",
         "plannedPillarsCount": 3,
         "requiredPillarsCount": 8
       }
       ```
  4. Update `prisma.dailyLog.update({ where: { id }, data: { isClosed }, include: { plans: true } })`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Daily log updated successfully",
    "data": {
      "id": "<uuid>",
      "date": "2026-06-06T13:24:49.000Z",
      "isClosed": true,
      "cycleId": "<uuid>",
      "userId": "<uuid>",
      "plans": []
    }
  }
  ```

---

### 4.6 Planned Actions (`POST /api/actions`, `PATCH /api/actions/:id`, `DELETE /api/actions/:id`)

#### `POST /api/actions`
- **Auth Required**: Yes (`req.userId`)
- **Request Body**:
  ```json
  {
    "categoryId": "<uuid>",
    "description": "Read 10 pages of Clean Code",
    "targetDate": "tomorrow",
    "logId": "<optional-uuid>"
  }
  ```
  - `categoryId`: required non-empty UUID string referencing a valid `HabitCategory`.
  - `description`: required non-empty trimmed string.
  - `targetDate`: optional `'today' | 'tomorrow'` (defaults to `'today'` if neither `logId` nor `targetDate` is specified).
  - `logId`: optional UUID of a specific `DailyLog` owned by `req.userId`.
- **Behavior**:
  1. Validate `categoryId` and non-empty `description` (`400 Bad Request` if missing/empty).
  2. Resolve target `DailyLog` for `req.userId`:
     - If `logId` is provided: query `prisma.dailyLog.findFirst({ where: { id: logId, userId: req.userId } })`. If not found, return `404 Not Found` `{ success: false, message: 'Daily log not found' }`.
     - Else if `targetDate === 'tomorrow'` or `targetDate === 'today'`: resolve the user's active cycle, and find or auto-create the `DailyLog` for `req.userId` and that calendar date (`today` or `tomorrow`).
     - Fallback if no active cycle exists: check latest `DailyLog` owned by `req.userId`; if none, return `400 Bad Request` `{ success: false, message: 'No daily log found to associate the action with' }`.
  3. **Closed-Day Check**: If `targetLog.isClosed === true`, return `400 Bad Request` `{ success: false, message: 'Cannot add or modify actions on a closed day' }`.
  4. **Upsert per Pillar per Day**: Check if a `PlannedAction` already exists for `{ userId: req.userId, logId: targetLog.id, categoryId }`. If it exists, update its `description` (preserving `isCompleted`); otherwise create a new `PlannedAction`.
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Action created successfully",
    "data": {
      "id": "<uuid>",
      "description": "Read 10 pages of Clean Code",
      "isCompleted": false,
      "logId": "<uuid>",
      "categoryId": "<uuid>",
      "userId": "<uuid>",
      "createdAt": "2026-06-06T13:24:49.000Z",
      "updatedAt": "2026-06-06T13:24:49.000Z"
    }
  }
  ```

#### `PATCH /api/actions/:id`
- **Auth Required**: Yes (`req.userId`)
- **URL Parameters**: `id` (UUID of the `PlannedAction`)
- **Request Body**:
  ```json
  {
    "description": "Read 20 pages of Clean Code",
    "isCompleted": true
  }
  ```
  - At least one of `description` (non-empty trimmed string) or `isCompleted` (boolean) must be provided.
- **Behavior**:
  1. Find `const existing = await prisma.plannedAction.findFirst({ where: { id, userId: req.userId }, include: { dailyLog: true } })`.
  2. If `!existing`, return `404 Not Found` `{ success: false, message: 'Action not found' }`.
  3. If `existing.dailyLog.isClosed`, return `400 Bad Request` `{ success: false, message: 'Cannot modify action on a closed day' }`.
  4. If `description !== undefined && !description.trim()`, return `400 Bad Request` `{ success: false, message: 'Description cannot be empty' }`.
  5. Update `prisma.plannedAction.update({ where: { id }, data: { ...(description !== undefined ? { description: description.trim() } : {}), ...(isCompleted !== undefined ? { isCompleted } : {}) } })`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Action updated successfully",
    "data": {
      "id": "<uuid>",
      "description": "Read 20 pages of Clean Code",
      "isCompleted": true,
      "logId": "<uuid>",
      "categoryId": "<uuid>",
      "userId": "<uuid>",
      "createdAt": "2026-06-06T13:24:49.000Z",
      "updatedAt": "2026-06-06T13:25:10.000Z"
    }
  }
  ```

#### `DELETE /api/actions/:id`
- **Auth Required**: Yes (`req.userId`)
- **URL Parameters**: `id` (UUID of the `PlannedAction`)
- **Behavior**:
  1. Find `const existing = await prisma.plannedAction.findFirst({ where: { id, userId: req.userId }, include: { dailyLog: true } })`.
  2. If `!existing`, return `404 Not Found` `{ success: false, message: 'Action not found' }`.
  3. If `existing.dailyLog.isClosed`, return `400 Bad Request` `{ success: false, message: 'Cannot delete action on a closed day' }`.
  4. Delete `await prisma.plannedAction.delete({ where: { id } })`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Action deleted successfully",
    "data": {
      "id": "<uuid>"
    }
  }
  ```

---

### 4.7 Frontend Service Layer (`frontend/src/services/api.ts`) Contract Alignment

`frontend/src/services/api.ts` must expose the following typed functions matching the backend contracts 100%:
- `fetchHabitCategories(): Promise<HabitCategory[]>` -> `GET /habits`
- `fetchActiveCycle(): Promise<Cycle | null>` -> `GET /cycles`
- `startNewCycle(initialGoals?: Array<{ categoryId: string; description: string }>): Promise<Cycle>` -> `POST /cycles`
- `createDailyLog(cycleId?: string, targetDate?: 'today' | 'tomorrow'): Promise<DailyLog>` -> `POST /days`
- `fetchDailyLogs(cycleId?: string): Promise<DailyLog[]>` -> `GET /days`
- `toggleDailyLogStatus(dayId: string, isClosed: boolean): Promise<DailyLog>` -> `PATCH /days/${dayId}`
- `fetchCycleProgress(cycleId?: string): Promise<CycleProgressResponse | null>` -> `GET /cycle-progress/${cycleId || 'current'}` (returning `{ stats, logs, pillarStats, dailySeries }`)
- `createAction(categoryId: string, description: string, options?: { targetDate?: 'today' | 'tomorrow'; logId?: string }): Promise<PlannedAction>` -> `POST /actions`
- `updateAction(actionId: string, payload: { description?: string; isCompleted?: boolean }): Promise<PlannedAction>` -> `PATCH /actions/${actionId}`
- `toggleActionStatus(actionId: string, isCompleted: boolean): Promise<PlannedAction>` -> `PATCH /actions/${actionId}`
- `deleteAction(actionId: string): Promise<{ id: string }>` -> `DELETE /actions/${actionId}`

---

## 5. Caveats

1. **Database Adapter Compatibility (`db.ts`)**: `main` uses `@prisma/adapter-neon` while `origin/dev` uses standard `PrismaClient()`. Using standard `PrismaClient()` works seamlessly with both local/Docker PostgreSQL (`postgresql://...`) and cloud PostgreSQL URLs (including Neon TCP connections) without requiring WebSocket polyfills.
2. **Close Day Pillar Threshold**: `README.md` specifies planning tomorrow's 8 pillars before closing today. In testing or custom environments where fewer than 8 `HabitCategory` records might exist, comparing against `Math.min(8, totalCategoriesCount)` (with 8 when seeded) ensures the Close Day gatekeeper works reliably.

---

## 6. Conclusion

The Proactive 31-Day Habit Tracker MVP requires executing Phases 1–4 (`FIX-01`..`FIX-04`, `FEAT-01`..`FEAT-03`, `UI-01`, `QUAL-01`) with strict `userId` multi-tenancy across all controllers, 100%-aligned `{ success, message, data }` envelopes between Express controllers and `frontend/src/services/api.ts`, reactive auth state in `HabitContext.tsx`, separated Today Execution vs. Tomorrow Proactive Planning logs with the Close Day gatekeeper, a `DESIGN.md`-driven dark UI workspace eliminating modal fatigue, live Recharts analytics, and a multi-tenant automated test suite.

---

## 7. Verification Method (E2E Testability & Build/UI Verification)

### 7.1 Build & Static Verification Commands
1. **Backend Typecheck & Build**:
   ```bash
   cd /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend && npm run typecheck && npm run build
   ```
   - Must exit with code `0` and emit `dist/index.js`.
2. **Frontend Typecheck & Production Build**:
   ```bash
   cd /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend && npm run build
   ```
   - Must run `tsc -b && vite build` and exit with code `0`.

### 7.2 API & Multi-Tenant Integration Verification (`QUAL-01`)
Automated integration tests (e.g., Vitest / Supertest or Node test runner in `backend/`) must verify:
1. **Auth Contract**:
   - `POST /api/auth/register` returns `201` with `{ success: true, data: { token, id, email } }`.
   - `POST /api/auth/login` returns `200` with `{ success: true, data: { token, id, email } }`.
   - Protected routes reject unauthenticated requests with `401`.
2. **8 Core Pillars**:
   - `GET /api/habits` returns `200` with `{ success: true, data: [...] }` containing all 8 seeded categories.
3. **Multi-Tenant Isolation (User A vs. User B)**:
   - User A starts a cycle (`POST /api/cycles`), creates today/tomorrow logs (`POST /api/days`), and creates actions (`POST /api/actions`).
   - User B registers and calls `GET /api/cycles`, `GET /api/days`, `GET /api/cycle-progress/current`: User B sees `null` cycle and `[]` logs (zero data leak from User A).
   - User B attempts `PATCH /api/actions/:userAActionId`, `DELETE /api/actions/:userAActionId`, and `PATCH /api/days/:userADayId`: all return `404` and leave User A's records unmodified.
4. **Proactive Engine & Close Day Gatekeeper**:
   - Creating a daily log (`POST /api/days` with `targetDate: 'today'`) twice on the same day returns the same `DailyLog.id` (idempotency).
   - Updating action text (`PATCH /api/actions/:id` with `{ description }`), toggling completion (`{ isCompleted: true }`), and deleting an action (`DELETE /api/actions/:id`) succeed while `dailyLog.isClosed === false`.
   - Attempting `PATCH /api/days/:todayLogId` with `{ isClosed: true }` before planning tomorrow's 8 pillars returns `400 Bad Request`.
   - After planning all 8 pillars for `targetDate: 'tomorrow'`, `PATCH /api/days/:todayLogId` with `{ isClosed: true }` returns `200 OK` with `isClosed: true`.
   - Subsequent attempts to `POST /api/actions`, `PATCH /api/actions/:id`, or `DELETE /api/actions/:id` on the closed `todayLogId` return `400 Bad Request`.
5. **Analytics Payload**:
   - `GET /api/cycle-progress/current` returns `stats`, `logs`, `pillarStats` (8 pillars), and `dailySeries`.

### 7.3 End-to-End UI Verification
1. Open `/login` & `/register`: register a new account -> automatically logs in and redirects to `/` without stuck loading or 401 error screen.
2. Start a 31-Day Sprint on `StartSprintScreen` (with optional Day 1 goal kickoff) -> transitions to the Command Center.
3. In Command Center:
   - Toggle Today's pillar goals (`isCompleted`), inline-edit a goal's `description`, and delete a goal.
   - Plan Tomorrow's 8 pillars inline in the Unified 8-Pillar Matrix -> watch the "Close Today" readiness indicator increment to `8/8 Pillars Planned`.
   - Click "Close Today" -> locks today's checkboxes and updates the 31-Day Progress Ribbon.
   - Click past day pills in the 31-Day Progress Ribbon -> inspects day logs.
4. Navigate to `/analytics` -> renders live `AnalyticsDashboard` charts and pillar breakdown table without runtime or console errors.
5. Click Logout -> clears auth store and `HabitContext` state, redirecting to `/login`.
