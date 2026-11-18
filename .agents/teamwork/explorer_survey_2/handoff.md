# Comprehensive Frontend, UI/UX & Dashboard Branch Technical Survey (`handoff.md`)

**Core Summary:** The `frontend/` workspace on `main` (`057527a`) implements JWT authentication (`useAuthStore` in `src/store/authStore.ts`, `apiClient` in `src/api/client.ts`) and a basic card+modal tracker (`HabitGrid.tsx`, `PlanningModal.tsx`), but suffers from broken auth reactivity in `HabitContext.tsx`, auth payload mismatches with `auth.controller.ts`, envelope mismatches with `day.controller.ts`, and a "Plan Tomorrow vs. Today's Goals" product logic paradox. Meanwhile, `origin/frontend/dashboard` (`c4df1f7`) branched **before** JWT auth was added—introducing `recharts`, `clsx`, `tailwind-merge`, shadcn-style UI primitives (`src/components/ui/*`), `AppLayout.tsx`, `Tracker.tsx`, and a 100%-mocked `AnalyticsDashboard.tsx`, while lacking `axios`, `zustand`, and auth routes.

---

## 1. Observation

### 1.1 Workspace & Configuration Files on `main` (`057527a`)

| File Path | Lines | Observed Structure & Exact Details |
| :--- | :---: | :--- |
| `frontend/package.json` | 1–39 | React 19 (`^19.2.6`), `react-router-dom` (`^7.17.0`), `axios` (`^1.17.0`), `lucide-react` (`^1.17.0`), `zustand` (`^5.0.14`). Dev dependencies: `@tailwindcss/vite` (`^4.3.0`), `tailwindcss` (`^4.3.0`), `typescript` (`~6.0.2`), `vite` (`^8.0.12`). Scripts (lines 6–11): `"dev": "vite"`, `"build": "tsc -b && vite build"`, `"lint": "eslint ."`, `"preview": "vite preview"`. Note: `origin/dev` changes line 7 to `"dev": "vite --host"` and adds `frontend/Dockerfile.dev` (lines 1–11) and `frontend/.dockerignore` (lines 1–7). |
| `frontend/vite.config.ts` | 1–12 | Registers `react()` and `tailwindcss()` (`@tailwindcss/vite`) plugins (lines 7–10). No path aliases (`@/*`) configured. |
| `frontend/tsconfig.json` | 1–8 | Solution-style config referencing `./tsconfig.app.json` and `./tsconfig.node.json` (lines 3–6). |
| `frontend/tsconfig.app.json` | 1–26 | Strict bundler config: `"verbatimModuleSyntax": true` (line 13, requires `import type` for type-only imports), `"noUnusedLocals": true` (line 19), `"noUnusedParameters": true` (line 20), `"erasableSyntaxOnly": true` (line 21). |
| `frontend/tsconfig.node.json` | 1–25 | Node config for `vite.config.ts` with identical strictness flags (lines 13, 18–21). |
| `frontend/tailwind.config.js` | 1–11 | Content globs `./index.html` and `./src/**/*.{js,ts,jsx,tsx}` (lines 3–6), empty `theme.extend` (line 8). Note: Tailwind v4 is loaded via `@import "tailwindcss";` in `src/index.css:1`. |
| `frontend/index.html` | 1–14 | `<html lang="en" class="dark">` (line 2) forces dark mode class at root; title `"31-Day Habit Tracker"` (line 7); mounts `#root` via `/src/main.tsx` (lines 10–11). No Google Fonts (`Inter`, `Plus Jakarta Sans`, `JetBrains Mono`) are linked yet. |
| `frontend/src/index.css` | 1–25 | Line 1: `@import "tailwindcss";`. Lines 3–9: sets `--font-sans: system-ui, ...`. Lines 11–17: `body { @apply bg-gray-50 text-gray-900 dark:bg-[#16171d] dark:text-gray-100; }`. |

### 1.2 Application Entry, Routing, Store, Context & API Layer on `main`

1. **`frontend/src/main.tsx` (lines 1–14):**
   - Lines 8–12: Wraps `<App />` inside `<HabitProvider>` at the top level outside `<Router>`:
     ```tsx
     createRoot(document.getElementById('root')!).render(
       <StrictMode>
         <HabitProvider>
           <App />
         </HabitProvider>
       </StrictMode>,
     )
     ```
2. **`frontend/src/App.tsx` (lines 1–102):**
   - Lines 14–78: Defines `HabitTrackerView()` inline in `App.tsx`. Reads `{ activeCycle, loading, error, refreshCycle } = useHabits()` (line 15) and `logout = useAuthStore((state) => state.logout)` (line 16).
   - Lines 20–45: Branches on `loading` (spinner, lines 20–25), `error` (error view with Retry button calling `refreshCycle`—which notably only calls `fetchActiveCycle()` and does NOT clear `error` or re-run `loadInitialData()`, lines 26–40), `!activeCycle` (`<StartSprintScreen />`, lines 41–42), or `<HabitGrid />` (lines 43–45).
   - Lines 80–99: `App()` renders `<Router>` with `/login` (`<Login />`), `/register` (`<Register />`), and `/` wrapped in `<ProtectedRoute><HabitTrackerView /></ProtectedRoute>`.
3. **`frontend/src/store/authStore.ts` (lines 1–29):**
   - Note: The file is named `authStore.ts` (not `useAuthStore.ts`), exporting `useAuthStore` and `interface User { id: string; email: string; }`.
   - Lines 16–28: Zustand `persist` middleware storing `{ token, user }` in `localStorage` under key `'auth-storage'` (line 25).
   - `login: (token, user) => set({ token, user })` (line 21), `logout: () => set({ token: null, user: null })` (line 22).
4. **`frontend/src/api/client.ts` (lines 1–39):**
   - Lines 4–9: Creates Axios instance with `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'`.
   - Lines 12–23: Request interceptor reads `useAuthStore.getState().token` and injects `Authorization: Bearer ${token}`.
   - Lines 26–36: Response interceptor calls `useAuthStore.getState().logout()` on any HTTP `401` response.
5. **`frontend/src/services/api.ts` (lines 1–145):**
   -Note: There is no `frontend/src/types/` directory; all domain types are declared in `frontend/src/services/api.ts`:
     - `HabitCategory` (lines 11–16): `{ id, name, description, icon? }`
     - `Cycle` (lines 18–23): `{ id, startDate, endDate, isActive }`
     - `PlannedAction` (lines 25–30): `{ id, categoryId, description, isCompleted }` (missing `logId?: string`)
     - `DailyLog` (lines 32–38): `{ id, date, isClosed, cycleId, plans: PlannedAction[] }`
     - `CycleStats` (lines 43–49): `{ cycleId, currentDayNumber, daysLogged, completedActions, overallCompletionRate }`
     - `CycleProgressResponse` (lines 100–103): `{ stats: CycleStats; logs: DailyLog[] }`
   - Service functions & backend contract mismatches observed:
     - `fetchHabitCategories()` (lines 59–62): `GET /habits` -> returns `response.data?.data || []`. (`habit.controller.ts:8-11` returns `{ sucess: true, data: habits }`).
     - `fetchActiveCycle()` (lines 68–75): `GET /cycles` -> returns `response.data?.data || null` (catches errors and returns `null`, masking 401/500 errors).
     - `startNewCycle()` (lines 77–80): `POST /cycles` -> returns `response.data?.data`.
     - `createDailyLog(cycleId)` (lines 86–89): `POST /days` with `{ cycleId }` -> returns `response.data?.data`. **MISMATCH**: `day.controller.ts:29` returns raw `day` (`res.status(201).json(day)`), so `response.data?.data` evaluates to `undefined`!
     - `toggleDailyLogStatus(dayId, isClosed)` (lines 91–94): `PATCH /days/${dayId}` with `{ isClosed }` -> returns `response.data?.data`. **MISMATCH**: `day.controller.ts:69` returns raw `day` (`res.status(200).json(day)`), so `response.data?.data` is `undefined`!
     - `fetchCycleProgress()` (lines 108–119): `GET /cycle-progress/current` -> returns `{ stats: response.data?.stats, logs: response.data?.logs || [] }`, catching errors and returning `null` (Note: when no active cycle exists, `cycleProgress.controller.ts:13` returns HTTP `400`, which logs a console error on every uninitialized user load).
     - `saveDailyGoal(categoryId, goal)` (lines 127–134): **DEAD CODE** calling `POST /goals` with `{ categoryId, goal, date: 'tomorrow' }`. Neither `/goals` route nor controller exists in `backend/`.
     - `createAction(categoryId, description)` (lines 136–139): `POST /actions` with `{ categoryId, description }` -> returns `response.data?.data`.
     - `toggleActionStatus(actionId, isCompleted)` (lines 141–144): `PATCH /actions/${actionId}` with `{ isCompleted }` -> returns `response.data?.data`.
6. **`frontend/src/context/HabitContext.tsx` (lines 1–124):**
   - State (lines 30–34): `categories`, `activeCycle`, `progress`, `loading` (init `true`), `error` (init `null`).
   - `getTodayLogFromLogs(logs)` (lines 36–49): Checks only `logs[logs.length - 1]` and compares `new Date(latestLog.date).toDateString() === new Date().toDateString()`. If a tomorrow log is also created in `logs` (ordered by `date: 'asc'`), `logs[logs.length - 1]` will be **tomorrow's** log, causing `getTodayLogFromLogs` to return `null` for today!
   - `loadInitialData()` (lines 51–84): Runs `Promise.all([fetchHabitCategories(), fetchActiveCycle(), fetchCycleProgress()])`. If `cycleData` is truthy and `!todayLog`, calls `await createDailyLog(cycleData.id)` and refetches `fetchCycleProgress()`.
   - **Broken Auth Reactivity (lines 104–106):**
     ```tsx
     useEffect(() => {
       loadInitialData();
     }, []);
     ```
     Because `HabitProvider` mounts once at app startup (`main.tsx:9`) and never subscribes to `useAuthStore((state) => state.token)`:
     1. When an unauthenticated user opens `/login`, `loadInitialData()` immediately fires `GET /habits`, `GET /cycles`, `GET /cycle-progress/current`. All 3 fail with `401 Unauthorized`. `fetchHabitCategories()` is uncaught, triggering the `catch` block (line 78) and setting `error = 'Failed to load application data. Please make sure the backend is running.'` (line 80).
     2. When the user logs in on `/login` and navigates to `/`, `HabitProvider` does **not** re-run `loadInitialData()`. The user lands on `<HabitTrackerView />` seeing the red error screen (`"Failed to load application data..."`), and clicking `"Retry"` (`App.tsx:34`) calls `refreshCycle` (`HabitContext.tsx:86-93`), which neither clears `error` nor loads `categories` or `progress`!
     3. When User A logs out and User B logs in without a full page reload, User A's `activeCycle`, `progress`, and `todayLog` remain in React state until overwritten.

### 1.3 Components on `main`

| Component | Lines | Key Observations & Line References |
| :--- | :---: | :--- |
| `src/components/auth/ProtectedRoute.tsx` | 1–18 | Reads `const token = useAuthStore((state) => state.token)` (line 10); redirects to `<Navigate to="/login" replace />` if `!token` (lines 12–14). |
| `src/components/auth/Login.tsx` | 1–113 | Posts to `/auth/login` (line 22). Lines 24–25: `const { token, id, email: userEmail } = response.data.data; login(token, { id, email: userEmail });`. **Bug**: `backend/src/controllers/auth.controller.ts:73` returns `data: { token, email }` without `id`, so `user.id` stored in Zustand is `undefined`. |
| `src/components/auth/Register.tsx` | 1–120 | Posts to `/auth/register` (line 23). Lines 26–33: checks `if (response.data.data && response.data.data.token)` to auto-login and `navigate('/')`, else `navigate('/login')`. Because `auth.controller.ts:31` returns `data: { id: user.id, email: user.email }` without `token`, newly registered users are forced to log in manually on `/login`. |
| `src/components/StartSprintScreen.tsx` | 1–73 | Calls `await startNewCycle()` (line 16) then `await refreshCycle()` (line 20). **Bug**: It only calls `refreshCycle()`, NOT `refreshProgress()` or `loadInitialData()`, so after starting a cycle, `todayLog` is NOT created and `progress` remains `null` until a manual page refresh! Also provides no Day 1 goal onboarding wizard. |
| `src/components/HabitCard.tsx` | 1–56 | Presentational card taking `{ name, description, icon, onClick }` (lines 3–8). |
| `src/components/HabitGrid.tsx` | 1–222 | Note: There is no separate `CycleHeader.tsx`; the cycle header is inline at lines 95–132. Maps `categories` to 8 `HabitCard` items (lines 146–156). Clicking a card sets `selectedCategory` (line 153), opening `<PlanningModal>` (lines 210–216). Renders `"Today's Specific Goals"` (lines 158–207) from `optimisticPlans` synced with `todayLog?.plans` (lines 46–52). Shows toast `"Goal saved for tomorrow!"` (line 141) when `PlanningModal` succeeds, even though `createAction` attaches the goal to **today's** log, so it immediately appears under `"Today's Specific Goals"`. No edit or delete buttons exist on goals, and no `"Close Day"` button exists anywhere in the UI. |
| `src/components/PlanningModal.tsx` | 1–109 | Modal titled `"Plan Tomorrow"` (line 43) with label `"What is your specific goal for tomorrow?"` (line 67). Calls `await createAction(category.id, goal)` (line 25) without specifying target day/log. |

### 1.4 Inspection of `origin/frontend/dashboard` (`c4df1f7`)

Comparing `main...origin/frontend/dashboard` (`17 files changed, 1216 insertions(+), 103 deletions(-)` across commits `0483abf`, `f0c8c05`, `c4df1f7`):

1. **Branch Divergence & Missing Auth Layer:**
   - `origin/frontend/dashboard` branched from `main` prior to the JWT authentication merge.
   - `origin/frontend/dashboard:frontend/package.json` (lines 12–20) adds `"clsx": "^2.1.1"`, `"recharts": "^3.8.1"`, and `"tailwind-merge": "^3.6.0"`, but **lacks** `"axios": "^1.17.0"` and `"zustand": "^5.0.14"`.
   - `origin/frontend/dashboard:frontend/src/App.tsx` (lines 1–18) has **no** `/login`, `/register`, or `<ProtectedRoute>`:
     ```tsx
     function App() {
       return (
         <Routes>
           <Route element={<AppLayout />}>
             <Route path="/" element={<AnalyticsDashboard />} />
             <Route path="/tracker" element={<Tracker />} />
           </Route>
         </Routes>
       )
     }
     ```
   - `origin/frontend/dashboard:frontend/src/main.tsx` (lines 10–14) wraps `<HabitProvider><App /></HabitProvider>` inside `<BrowserRouter>`.
2. **`frontend/src/components/AppLayout.tsx` (lines 1–141 on `origin/frontend/dashboard`):**
   - Renders a full-screen flex container (`flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans`, line 18).
   - Sidebar (`<aside>`, lines 21–96): Fixed width `w-64`, non-collapsible, styled with an off-brand rose gradient (`bg-gradient-to-b from-rose-900 to-rose-950 border-r border-rose-800/50`).
   - Hardcoded profile card (lines 29–40): `"George Santana"` / `"Pro Member"` with external avatar `https://i.pravatar.cc/150?u=george`.
   - Navigation links (lines 52–88): `Analytics` (`/`), `Habit Tracker` (`/tracker`), plus dead `<a href="#">` links for `Integrations` and `Settings`.
   - Footer (lines 90–95): `<a href="#">` `"Log Out"` button that is NOT wired to `useAuthStore.logout()`.
   - Top Header (lines 102–132): Contains non-functional search input, `Globe`, `Sun`, `ShoppingCart`, `Bell` icon buttons, and a duplicate hardcoded avatar.
   - Content Outlet (lines 135–137): `<main className="flex-1 overflow-y-auto p-6 md:p-8"><Outlet /></main>`.
3. **`frontend/src/pages/Tracker.tsx` (lines 1–64 on `origin/frontend/dashboard`):**
   - Consumes `const { activeCycle, loading, error, refreshCycle } = useHabits()` (line 9).
   - Renders header with `"View Analytics Dashboard"` button linking to `/` (lines 53–57) and delegates body to `StartSprintScreen` or `HabitGrid` (lines 34–38).
4. **`frontend/src/pages/AnalyticsDashboard.tsx` (lines 1–312 on `origin/frontend/dashboard`):**
   - **Zero integration with `HabitContext` or `services/api.ts`**.
   - Hardcoded mock arrays:
     - `barChartData` (lines 13–23): Monthly aggregates (`Feb`–`Oct`) with `Planned`, `Completed`, `Skipped`.
     - `radialData` (lines 25–29): Only 3 categories (`Health`, `Work`, `Learning`) instead of the 8 Core Pillars.
     - `tableData` (lines 31–37): 5 fake habits (`Morning Run`, `Read 20 Pages`, etc.).
     - `activityData` (lines 39–44): 4 fake timestamps (`Completed Morning Run`, `2 hours ago`, etc.).
   - Layout (12-column grid, line 61):
     - Row 1: `"Unlock Pro Analytics"` promotional card (`md:col-span-3`, lines 64–77) + 3 KPI cards (`Habits Completed: 1,248`, `Active Cycles: 14`, `Consistency Growth: 24.5%`, lines 79–161).
     - Row 2: Recharts `<BarChart>` (`Completion Consistency`, `md:col-span-8`, lines 164–191) + Recharts `<PieChart>` (`Overview`, `md:col-span-4`, lines 193–242).
     - Row 3: `Top Habits` `<Table>` (`md:col-span-8`, lines 245–283) + `Recent Activity` list (`md:col-span-4`, lines 285–307).
5. **UI Primitives on `origin/frontend/dashboard`:**
   - `frontend/src/lib/utils.ts` (lines 1–6): `cn(...inputs: ClassValue[])` using `clsx` + `tailwind-merge`.
   - `frontend/src/components/ui/avatar.tsx` (lines 1–19), `button.tsx` (lines 1–37), `card.tsx` (lines 1–34), `input.tsx` (lines 1–23), `table.tsx` (lines 1–36): Clean forwardRef primitives styled with Tailwind `slate-*` classes.

---

## 2. Logic Chain

1. **Why `origin/frontend/dashboard` Must Be Selectively Ported Rather Than Merged via `git merge`:**
   - Because `origin/frontend/dashboard` (`c4df1f7`) modified `package.json`, `main.tsx`, `App.tsx`, `HabitGrid.tsx`, `HabitCard.tsx`, `PlanningModal.tsx`, and `StartSprintScreen.tsx` on top of a pre-auth commit, a raw `git merge` would conflict with `main`'s auth routing (`App.tsx`), drop `axios`/`zustand` if `package.json` isn't merged carefully, and introduce off-brand colors (`rose-900` sidebar, `lime-400` buttons, `cyan-400` accents) that contradict the Phase 3 `DESIGN.md` specification ("Focused Obsidian & Electric Violet").
   - Therefore, we should keep `main` (after merging `origin/dev`) as the base, install `recharts`, `clsx`, and `tailwind-merge` in `frontend/package.json`, and port `src/lib/utils.ts` and `src/components/ui/{avatar,button,card,input,table}.tsx` (updated to `DESIGN.md` tokens), then build `AppLayout.tsx` and `AnalyticsDashboard.tsx` directly on the authenticated architecture.

2. **Why `HabitContext.tsx` Fails After Login & How to Fix It (Phase 1):**
   - `HabitProvider` (`HabitContext.tsx:29`) wraps `<App />` (`main.tsx:9`). On initial render when unauthenticated (`token === null`), `useEffect(() => { loadInitialData(); }, [])` (`HabitContext.tsx:104-106`) executes `Promise.all([fetchHabitCategories(), fetchActiveCycle(), fetchCycleProgress()])`.
   - Because `fetchHabitCategories()` does not have a `try/catch` in `api.ts:59-62`, the `401` rejection lands in `loadInitialData`'s `catch` (`HabitContext.tsx:78-80`), setting `error = 'Failed to load application data...'`.
   - Subscribing `HabitContext.tsx` to `const token = useAuthStore((state) => state.token)` solves all three lifecycle bugs:
     - When `!token`: reset `categories = []`, `activeCycle = null`, `progress = null`, `error = null`, `loading = false`, and skip network requests.
     - When `token` transitions from `null` to a valid JWT (on login or register): `useEffect([token])` triggers `loadInitialData()`, setting `loading = true`, clearing `error = null`, and fetching the authenticated user's data.
     - Also, `StartSprintScreen.tsx:20` and `App.tsx:34` call `refreshCycle()`, which currently only updates `activeCycle` without initializing `todayLog` or refreshing `progress`. Adding `reloadAll: () => Promise<void>` (or having `refreshCycle` also trigger `loadInitialData()`) ensures starting a sprint immediately creates Day 1's log and hydrates `progress`.

3. **How to Resolve the "Today's Execution" vs. "Tomorrow's Proactive Plan" Paradox (Phase 2):**
   - In `HabitContext.tsx:36-49`, `getTodayLogFromLogs` currently inspects only `logs[logs.length - 1]`. Once users can plan for **tomorrow**, `progress.logs` will contain both Today's `DailyLog` and Tomorrow's `DailyLog`.
   - Therefore, date matching in `HabitContext.tsx` must search `progress.logs` using normalized calendar-day comparison (comparing YYYY-MM-DD in local time or UTC consistently with backend) to derive **both** `todayLog: DailyLog | null` and `tomorrowLog: DailyLog | null`, plus `selectedDayLog: DailyLog | null` (for Phase 4's Day Inspector).
   - On Day 1 of a new sprint (or if `todayLog.plans.length === 0` on Day 1), the user must be able to populate **Today's (Day 1)** goals (`targetDate: 'today'` or `logId: todayLog.id`). Simultaneously, for the proactive loop, every pillar row has an inline input targeting **Tomorrow's** log (`targetDate: 'tomorrow'` or `logId: tomorrowLog?.id`).
   - Closing today (`PATCH /api/days/:id` with `{ isClosed: true }`) requires checking that Tomorrow's plan meets the readiness threshold (e.g., all 8 pillars planned for tomorrow, or configurable threshold, except on Day 31 where no Day 32 exists).

---

## 3. Caveats

- **`frontend/node_modules` Installation State:** `frontend/node_modules` is not pre-installed in the bare git checkout on disk (`list_dir` showed 12 files and 2 directories `public`, `src`). Any implementation agent running `npm run build` or `npm run lint` in `frontend/` must run `npm install` (or `npm ci`) first.
- **Calendar Date / Timezone Normalization:** `HabitContext.tsx:41-42` currently uses `new Date(latestLog.date).toDateString()` (local browser timezone). When the backend implements idempotent daily log creation (`POST /api/days` with `targetDate: 'today' | 'tomorrow'` or ISO date string), frontend and backend must agree on calendar date comparison so `todayLog` and `tomorrowLog` never drift across midnight UTC vs. local time. Comparing `YYYY-MM-DD` strings or passing local date / `targetDate` explicitly avoids timezone skew.
- **Day 31 Close-Day Exception:** On Day 31 of 31 (`currentDayNumber === 31`), the sprint ends (`endDate`), so closing Day 31 should **not** require planning Day 32; instead, closing Day 31 triggers the Sprint Completion Celebration & "Start Next 31-Day Sprint" rollover (Phase 4.2).

---

## 4. Conclusion & Phase-by-Phase Frontend Implementation Strategy

### 🛠️ Phase 1 Frontend: Auth Reactivity, Payload Alignment & Dead Code Cleanup

#### 1. `frontend/src/context/HabitContext.tsx` (Lines 1–124)
- **Import `useAuthStore`:** Add `import { useAuthStore } from '../store/authStore';` after line 14.
- **Subscribe to `token`:** Inside `HabitProvider` (after line 34), add:
  ```tsx
  const token = useAuthStore((state) => state.token);
  ```
- **Fix `useEffect` Reactivity & Logout Cleanup (replace lines 104–106):**
  ```tsx
  useEffect(() => {
    if (!token) {
      setCategories([]);
      setActiveCycle(null);
      setProgress(null);
      setError(null);
      setLoading(false);
      return;
    }
    loadInitialData();
  }, [token]);
  ```
- **Fix `getTodayLogFromLogs` (lines 36–49):** Replace `const latestLog = logs[logs.length - 1]` with `logs.find(...)` matching today's `toDateString()` so that if tomorrow's log also exists in `logs`, `todayLog` is still found accurately:
  ```tsx
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getTodayLogFromLogs = (logs: DailyLog[]): DailyLog | null => {
    if (!logs || logs.length === 0) return null;
    const now = new Date();
    return logs.find((log) => isSameDay(new Date(log.date), now)) || null;
  };
  ```
- **Fix `refreshCycle` (lines 86–93):** When `StartSprintScreen` starts a new cycle or `App.tsx` retries after an error, calling `refreshCycle()` should re-run `await loadInitialData()` so that `todayLog` is auto-created and `progress` + `categories` are freshly loaded with `error` cleared.

#### 2. `frontend/src/components/auth/Login.tsx` (Lines 21–28) & `Register.tsx` (Lines 21–35)
- **`Login.tsx` (lines 23–27):** Once `backend/src/controllers/auth.controller.ts` returns `{ token, id: user.id, email: user.email }`, `Login.tsx:24-25` (`const { token, id, email: userEmail } = response.data.data; login(token, { id, email: userEmail });`) will receive a defined `id`. Add a defensive fallback `id: id || ''` just in case.
- **`Register.tsx` (lines 24–34):** Once `auth.controller.ts:register` returns `{ token, id: user.id, email: user.email }`, `Register.tsx:26-29` will automatically execute `login(token, { id, email: userEmail })` and `navigate('/')`, logging the user right into their Sprint Launchpad without a redundant `/login` redirect.

#### 3. `frontend/src/services/api.ts` (Lines 86–145)
- **Remove dead `saveDailyGoal`:** Delete lines 121–134 (`saveDailyGoal` targeting `/goals`).
- **Handle `day.controller.ts` envelope:** Once `day.controller.ts` is standardized to `{ success: true, data: day }`, `createDailyLog` (line 88) and `toggleDailyLogStatus` (line 93) returning `response.data?.data ?? response.data` will work seamlessly with both standardized and raw payloads.
- **Avoid false error logging in `fetchCycleProgress` (lines 108–119):** If `GET /cycle-progress/current` returns `400` or `404` when no active cycle exists, return `null` quietly without `console.error`.

---

### ⚙️ Phase 2 Frontend: Proactive 31-Day Engine, Inline Goal CRUD & "Close Day" Gatekeeper

#### 1. `frontend/src/services/api.ts` — Expanded Action & Day API Functions
- Update `PlannedAction` interface (lines 25–30) to include `logId?: string;`.
- Update `createDailyLog` (lines 86–89) to accept optional `targetDate?: 'today' | 'tomorrow' | string`:
  ```ts
  export const createDailyLog = async (
    cycleId: string,
    targetDate: 'today' | 'tomorrow' = 'today'
  ): Promise<DailyLog> => {
    const response = await apiClient.post('/days', { cycleId, targetDate });
    return response.data?.data ?? response.data;
  };
  ```
- Update `createAction` (lines 136–139) to accept optional `options?: { logId?: string; targetDate?: 'today' | 'tomorrow' }`:
  ```ts
  export const createAction = async (
    categoryId: string,
    description: string,
    options?: { logId?: string; targetDate?: 'today' | 'tomorrow' }
  ): Promise<PlannedAction> => {
    const response = await apiClient.post('/actions', {
      categoryId,
      description,
      ...options,
    });
    return response.data?.data;
  };
  ```
- Expand Action CRUD (replacing/extending `toggleActionStatus` at lines 141–144):
  ```ts
  export const updateAction = async (
    actionId: string,
    payload: { description?: string; isCompleted?: boolean }
  ): Promise<PlannedAction> => {
    const response = await apiClient.patch(`/actions/${actionId}`, payload);
    return response.data?.data;
  };

  export const toggleActionStatus = async (
    actionId: string,
    isCompleted: boolean
  ): Promise<PlannedAction> => {
    return updateAction(actionId, { isCompleted });
  };

  export const deleteAction = async (actionId: string): Promise<void> => {
    await apiClient.delete(`/actions/${actionId}`);
  };
  ```
- Update `toggleDailyLogStatus` / add `closeDailyLog(dayId: string)` (lines 91–94):
  ```ts
  export const closeDailyLog = async (dayId: string): Promise<DailyLog> => {
    const response = await apiClient.patch(`/days/${dayId}`, { isClosed: true });
    return response.data?.data ?? response.data;
  };
  ```

#### 2. `frontend/src/context/HabitContext.tsx` — Expose `todayLog`, `tomorrowLog`, and Helper Actions
- Extend `HabitContextType` (lines 16–25) to include:
  - `todayLog: DailyLog | null;`
  - `tomorrowLog: DailyLog | null;`
  - `selectedDayNumber: number;` and `setSelectedDayNumber: (day: number) => void;` (for Phase 4 Day Inspector)
  - `selectedDayLog: DailyLog | null;`
- Derive `tomorrowLog` alongside `todayLog`:
  ```tsx
  const getTomorrowLogFromLogs = (logs: DailyLog[]): DailyLog | null => {
    if (!logs || logs.length === 0) return null;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return logs.find((log) => isSameDay(new Date(log.date), tomorrow)) || null;
  };
  ```

#### 3. Inline Edit & Delete + Today vs. Tomorrow Separation + "Close Day" Gatekeeper
- **Inline Editing & Deleting Goals (Closes Issue #6):**
  - For any `PlannedAction` where the parent `DailyLog.isClosed === false`, clicking the description text or an edit (`Pencil`) icon switches the row into an inline `<input>` pre-filled with `action.description` (`Enter` or blur saves via `updateAction(action.id, { description })`; `Escape` cancels).
  - Clicking the delete (`Trash2` / `X`) icon calls `deleteAction(action.id)` with optimistic removal from local state and `refreshProgress()`.
  - When `todayLog.isClosed === true`, Today's checkboxes, inline edit, and delete controls are locked (disabled with an emerald `"Day Closed & Locked"` badge).
- **Separating Today's Execution from Tomorrow's Proactive Plan:**
  - Each of the 8 Core Pillars displays two distinct slots:
    1. **Today's Execution (`todayLog`):** Checkable completion box + goal text (inline-editable if `!todayLog?.isClosed`). If Day 1 has no goal for a pillar (or user hasn't set today's goal yet), shows an inline `+ Set today's goal...` input calling `createAction(category.id, text, { targetDate: 'today', logId: todayLog?.id })`.
    2. **Tomorrow's Proactive Plan (`tomorrowLog`):** Inline quick-input (`+ Plan tomorrow's action...`) or existing tomorrow action (inline-editable & deletable) calling `createAction(category.id, text, { targetDate: 'tomorrow', logId: tomorrowLog?.id })`.
- **"Close Day" Gatekeeper Button & Readiness Indicator:**
  - Calculate `tomorrowPlannedCount`: number of distinct pillars (`categories`) that have at least one planned action in `tomorrowLog?.plans` (from `0` to `8`).
  - Display readiness badge: `${tomorrowPlannedCount} / 8 Pillars Planned for Tomorrow` (Amber `#F59E0B` while `< 8` or `< requiredCount`, Emerald `#10B981` when ready).
  - `"Close Today & Lock Tomorrow"` CTA button calls `closeDailyLog(todayLog.id)` (disabled with tooltip if `todayLog.isClosed` or if tomorrow's plan requirement is not met, unless `currentDayNumber === 31`).

---

### 🎨 Phase 3 Frontend: `DESIGN.md` & 4-Screen Stitch Redesign (Closes Issue #11)

#### Step 3.1: Create `/DESIGN.md` (Design System Specification)
Create `/home/antigravity/GeorgeDeveloperJ/habits-tracker/DESIGN.md` defining:
1. **Color Palette ("Focused Obsidian & Electric Violet"):**
   - Canvas Background: `#0B0D13`
   - Elevated Surface / Cards: `#12151E`
   - Interactive / Hover Surface: `#181C28`
   - Glassmorphic Surface: `rgba(18, 21, 30, 0.78)` with `backdrop-filter: blur(16px)`
   - Hairline Border: `#1E2330` (`1px solid`)
   - Active / Focus Border: `#8B5CF6`
   - Primary Accent (Electric Violet): `#8B5CF6` (hover `#7C3AED`, subtle badge bg `rgba(139, 92, 246, 0.12)`)
   - Completion / Emerald State: `#10B981` (subtle bg `rgba(16, 185, 129, 0.12)`)
   - Pending Tomorrow Plan / Amber Warning: `#F59E0B` (subtle bg `rgba(245, 158, 11, 0.12)`)
   - Danger / Missed / Error: `#EF4444`
   - Typography Hierarchy: Primary `#F8FAFC`, Secondary `#94A3B8`, Muted `#64748B`
2. **Typography & Fonts (`frontend/index.html` & `frontend/src/index.css`):**
   - Load Google Fonts `Plus Jakarta Sans` (or `Inter`) and `JetBrains Mono` in `frontend/index.html`.
   - Define `--font-sans: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;` and `--font-mono: 'JetBrains Mono', monospace;` in `frontend/src/index.css`.
   - Apply `font-mono tabular-nums` to all sprint counters (`Day 04 / 31`), percentages (`87%`), and streak metrics.
3. **Layout Architecture:**
   - **Collapsible Left Navigation Rail (`src/components/AppLayout.tsx`):** Replaces `origin/frontend/dashboard`'s rose sidebar with an Obsidian (`#12151E`) collapsible rail (`w-64` expanded, `w-20` collapsed toggleable via state) showing:
     - Brand mark (`31-Day Sprint` / Electric Violet icon)
     - Live sprint mini-status pill (`Day XX / 31`)
     - Primary nav links: **Command Center** (`/`) and **Analytics & Balance** (`/analytics`)
     - Authenticated user card wired to `useAuthStore((s) => s.user?.email)` (with dynamic initials avatar) and a functional **Log Out** button wired to `useAuthStore((s) => s.logout)`.

#### Step 3.2: Screen-by-Screen Implementation Plan

1. **Screen 1 — Auth Split-Screen (`src/components/auth/Login.tsx` & `src/components/auth/Register.tsx`):**
   - **Left Panel (Desktop `lg:flex lg:w-1/2`):** Obsidian `#0B0D13` canvas with radial violet glow, displaying the value proposition *"Plan Tonight. Execute Tomorrow."* + an interactive 31-day sprint matrix preview card and the 8 Core Pillars badges.
   - **Right Panel:** Glassmorphic auth card (`bg-[#12151E]/90 border border-[#1E2330] rounded-2xl p-8`) with email/password inputs, inline error banners, loading states, and seamless switch between `/login` and `/register`.

2. **Screen 2 — 31-Day Sprint Launchpad (`src/components/StartSprintScreen.tsx`):**
   - **Interactive 31-Node Calendar Preview:** Visualizes the upcoming 31 days (start date → end date) with `JetBrains Mono` day badges.
   - **Step-by-Step Day 1 Pillar Kickoff Wizard:** Allows the user to optionally pre-fill their **Day 1 initial goals** across the 8 Core Pillars right on the launchpad (with quick-suggestion chips per pillar, e.g., *Learning: "Read 20 pages"*, *Physical Health: "30m workout"*).
   - Clicking **"Launch 31-Day Sprint"** calls `startNewCycle()`, creates Day 1's log (`createDailyLog(cycle.id, 'today')`), batch-creates any pre-filled Day 1 goals (`createAction(catId, desc, { targetDate: 'today', logId: day1Log.id })`), and calls `refreshCycle()` / `loadInitialData()` so the user lands in the Command Center with Day 1 ready to execute!

3. **Screen 3 — Primary Command Center (`src/components/HabitGrid.tsx` / `src/pages/Tracker.tsx`):**
   - **Top 12-Column Bento Header:**
     - **31-Day Interactive Progress Ribbon (col-span-12 lg:col-span-7):** Renders pills `01` through `31` in `JetBrains Mono`. Each pill is color-coded by status:
       - *Closed / Completed Day*: Emerald `#10B981`
       - *Past Logged Day (partial)*: Violet `#8B5CF6`
       - *Today (`currentDayNumber`)*: Electric Violet ring + pulsing dot
       - *Tomorrow (`currentDayNumber + 1`)*: Amber `#F59E0B` dashed border if planned
       - *Upcoming Days*: Muted `#1E2330`
       - Clicking any day `1..currentDayNumber` selects it for inspection!
     - **Sprint Telemetry & Circular Ring (col-span-6 lg:col-span-2):** SVG circular progress ring showing `overallCompletionRate%`, `Days Logged`, and `Actions Done`.
     - **"Close Today" Gatekeeper Card (col-span-6 lg:col-span-3):** Shows `${tomorrowPlannedCount}/8 Pillars Planned for Tomorrow` progress bar and the **"Close Today & Lock Tomorrow"** button.
   - **Unified 8-Pillar Matrix (Eliminates `PlanningModal` Fatigue):**
     - Renders all 8 Core Pillars (`categories`) in a unified table/matrix layout where each pillar row contains:
       - **Col 1 — Pillar Identity:** Icon + Pillar Name + Description tooltip/subtitle.
       - **Col 2 — Today's Execution (or Inspected Past Day):** Checkbox + goal description + inline click-to-edit (`Pencil`), delete (`Trash2`), or inline `+ Set today's goal...` input if empty.
       - **Col 3 — Tomorrow's Proactive Plan:** Inline input field (`+ Plan tomorrow's action...` with `Enter` or Save button) or existing planned goal for tomorrow with inline edit/delete and an Amber/Emerald status dot.
     - Keep `PlanningModal.tsx` either updated as an optional fallback or deprecated in favor of the zero-modal inline matrix.

4. **Screen 4 — Analytics & Pillar Balance Dashboard (`src/pages/AnalyticsDashboard.tsx` at route `/analytics`):**
   - Update `App.tsx` routing:
     ```tsx
     <Route path="/login" element={<Login />} />
     <Route path="/register" element={<Register />} />
     <Route
       element={
         <ProtectedRoute>
           <AppLayout />
         </ProtectedRoute>
       }
     >
       <Route path="/" element={<Tracker />} />
       <Route path="/analytics" element={<AnalyticsDashboard />} />
     </Route>
     ```
   - Style with `DESIGN.md` Obsidian (`#0B0D13` / `#12151E`) and Electric Violet (`#8B5CF6`) / Emerald (`#10B981`) / Amber (`#F59E0B`).
   - Remove the fake `"Unlock Pro Analytics"` upsell card and replace hardcoded mock arrays with real data (see Phase 4 below).

---

### 🚀 Phase 4 Frontend: Live Analytics Wiring, Day Inspector, Day 31 Rollover & Verification

#### 1. Wiring `AnalyticsDashboard.tsx` to Live Data (`useHabits()` + API)
- Consume `{ categories, activeCycle, progress, todayLog }` from `useHabits()` (plus any extended fields returned by `GET /api/cycle-progress/current` such as `pillarBreakdown` or `dailySeries`—and compute client-side fallbacks directly from `categories` and `progress.logs` so the dashboard works even with the existing `logs[].plans[]` payload!):
  - **KPI Cards (Row 1 — 4 Cards):**
    1. **Overall Completion Rate:** `progress?.stats?.overallCompletionRate ?? 0`% (with circular/sparkline indicator).
    2. **Actions Completed:** `${completedActions} / ${totalActions}` across the 31-day cycle.
    3. **Sprint Progress:** `Day ${currentDayNumber} / 31` (`${daysLogged} days logged`, `${closedDaysCount} days closed`).
    4. **Tomorrow Readiness:** `${tomorrowPlannedCount} / 8 Pillars` planned for tomorrow.
  - **8-Pillar Balance Chart (`RadarChart` or Horizontal `BarChart` via Recharts):**
    - For each of the 8 `categories`, compute `plannedCount`, `completedCount`, and `completionRate = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0` across `progress.logs` (or read from backend `pillarStats`).
    - Render a Recharts `RadarChart` (`PolarGrid`, `PolarAngleAxis`, `Radar`) or `BarChart` showing which of the 8 life pillars are thriving vs. neglected.
  - **31-Day Consistency Trend Chart (`AreaChart` / `BarChart` via Recharts):**
    - Map days `1..31` of the active cycle (`startDate` + `i` days) against `progress.logs` to plot daily `Planned` vs. `Completed` actions across the sprint.
  - **Pillar Breakdown Table (`src/components/ui/table.tsx`):**
    - Lists all 8 Core Pillars with their icon, total planned actions, completed actions, current pillar streak (consecutive logged days with completed action), and completion rate badge.

#### 2. Sprint History & Day Inspector (Clicking Past Days 1..N in the 31-Day Ribbon)
- In the Command Center (`HabitGrid.tsx`), maintain `selectedDayNumber` (defaulting to `currentDayNumber`).
- When the user clicks any past day pill (`dayNumber < currentDayNumber`) in the 31-Day Progress Ribbon:
  - Set `selectedDayNumber = dayNumber` and look up the corresponding `DailyLog` from `progress.logs` by matching its calendar date (`cycleStartDate + (dayNumber - 1) days`).
  - Render an **"Inspecting Day XX of 31 (Read-Only History)"** banner at the top of the 8-Pillar Matrix with a **"Return to Today (Day YY)"** button.
  - In read-only inspection mode, display each of the 8 pillars with the action planned for that day and its status badge (**Completed** in `#10B981` Emerald, **Missed** in `#EF4444` Red, or **Not Planned** in `#64748B` Slate), with checkboxes and inputs disabled.

#### 3. Day 31 Completion Celebration & "Start Next 31-Day Sprint" Rollover
- When `currentDayNumber >= 31` and `todayLog?.isClosed === true` (or when `new Date(activeCycle.endDate) < new Date()`):
  - Display a **Sprint Complete Celebration Banner / Modal** summarizing the 31-day sprint metrics (`overallCompletionRate%`, total `completedActions`, top-performing pillar, total `daysLogged`).
  - Provide a primary CTA **"Start Next 31-Day Sprint"** that calls `startNewCycle()` and `loadInitialData()` (which deactivates the finished cycle on the backend and launches a fresh 31-day cycle).

---

## 5. Verification Method

To independently verify these findings and validate the frontend implementation across Phases 1–4:

1. **Inspect Current Files & Branch Diffs:**
   ```bash
   git status
   git diff main...origin/frontend/dashboard --stat
   git diff main...origin/dev -- frontend
   ```
2. **Install Dependencies & Verify TypeScript + Vite Build:**
   ```bash
   npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend install
   npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run lint
   npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run build
   ```
   - Must exit with code `0` (`tsc -b && vite build` with strict `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`).
3. **End-to-End Functional Verification Checklist:**
   - **Unauthenticated cold load (`/login`):** Open `/login` with empty `localStorage`; verify `HabitContext` does **not** fire `GET /habits` or `GET /cycles` until `token` is set, and no `401` console errors occur.
   - **Registration & Login flow (`/register` -> `/`):** Register a new user; verify `useAuthStore` persists `{ token, user: { id, email } }`, `HabitContext` automatically runs `loadInitialData()`, and the user lands on `StartSprintScreen`.
   - **Sprint Kickoff & Day 1 Onboarding:** Start a 31-day sprint with Day 1 goals; verify `activeCycle`, `todayLog`, and Day 1 `PlannedAction` items render immediately in the Command Center without requiring a browser refresh.
   - **Inline Goal CRUD & Today vs. Tomorrow Separation:** Create, inline-edit (`PATCH /api/actions/:id`), toggle (`isCompleted`), and delete (`DELETE /api/actions/:id`) actions in both Today's Execution and Tomorrow's Plan columns.
   - **Close Day Gatekeeper:** Plan tomorrow's pillars, click **"Close Today & Lock Tomorrow"** (`PATCH /api/days/:id`), and verify `todayLog.isClosed` locks today's actions.
   - **Day Inspector & Analytics (`/analytics`):** Click a past day pill in the 31-Day Ribbon to verify read-only inspection, and navigate to `/analytics` to verify live Recharts rendering from `useHabits()` data.
