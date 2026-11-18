# Step 0 Technical Survey: Backend, Git Branches & Runtime Environment

**Core Summary:** `origin/dev` (`e950438`, PR #10) is a clean fast-forward descendant of `main` (`057527a`) adding Docker orchestration and standard `PrismaClient` initialization. In `backend/src/`, the Prisma schema (`backend/prisma/schema.prisma`) already enforces `userId` foreign keys on `Cycle`, `DailyLog`, and `PlannedAction`, and `authMiddleware.ts` attaches `req.userId`, but almost all controller queries omit `userId` scoping, lack idempotency, mix response envelopes, and attach "Plan Tomorrow" actions to today's log. In the VM runtime environment, Node `v24.22.2` and PostgreSQL `15.19` binaries (`/usr/lib/postgresql/15/bin/{initdb,pg_ctl,postgres}`) are available in user-space, enabling full Prisma migrations, seeding, and real multi-tenant integration tests without requiring root or Docker.

---

## 1. Observation

### 1.1 Git Branch Topology & `main...origin/dev` Diff

- **Command executed:** `git status && git branch -a && git log --oneline --graph --all -n 20`
- **Current branch:** `main` at commit `057527a` (`Merge pull request #8 from GeorgeDeveloperJ/feat/user-multi-tenancy-db`), working tree clean (only `.agents/` untracked).
- **Remote branches:**
  | Remote Branch | Commit | Subject / Relationship to `main` (`057527a`) |
  | :--- | :--- | :--- |
  | `origin/main` | `057527a` | Active default branch (contains User model, JWT auth, Neon adapter). |
  | `origin/dev` | `e950438` | **9 commits ahead of `main`, 0 commits behind** (`Merge pull request #10 from GeorgeDeveloperJ/feat/dockerize-env`). Direct descendant of `057527a` — fast-forward mergeable (`git merge origin/dev`). |
  | `origin/feat/dockerize-env` | `43bda0c` | Tip of PR #10 merged into `origin/dev`. |
  | `origin/frontend/dashboard` | `c4df1f7` | Diverged from `455f836` (pre-PR #8 auth). Adds `AppLayout.tsx`, `Tracker.tsx`, `AnalyticsDashboard.tsx`, `recharts`, and `src/components/ui/*` primitives. |
  | `origin/feat/user-multi-tenancy-db` | `48d137b` | Merged into `main` via PR #8 (`057527a`). |

- **Exact diff `git diff --stat main...origin/dev` (13 files changed, 561 insertions, 19 deletions):**
  1. `docker-compose.yml` (+50 lines, new file): Defines `db` (`postgres:17-alpine`, `env_file: .env`, volume `postgres_data`, `pg_isready` healthcheck), `backend` (`Dockerfile.dev`, port `${PORT:-3000}:3000`, `env_file: ./backend/.env`, `depends_on: db`, bind mount `./backend:/app` + `backend_node_modules`), and `frontend` (`Dockerfile.dev`, port `5173:5173`, `env_file: ./frontend/.env`, bind mount `./frontend:/app` + `frontend_node_modules`).
  2. `backend/Dockerfile` (+24 lines, new file): Two-stage `node:24-alpine` production image (`DATABASE_URL="postgresql://dummy" npx prisma generate`, `npm run build`, `CMD ["node", "dist/index.js"]`).
  3. `backend/Dockerfile.dev` (+11 lines, new file): `node:24-alpine`, copies `package*.json` and `prisma/`, runs `npm ci` and `npx prisma generate`, `CMD ["node", "scripts/entrypoint.js"]`.
  4. `backend/.dockerignore` (+9 lines, new file): Ignores `node_modules`, `dist`, `.env`, `.env.*`, `*.log`.
  5. `backend/scripts/entrypoint.js` (+10 lines, new file): Executes `npx prisma migrate deploy`, `npx prisma db seed`, and `npm run dev` via `child_process.execSync`. (Note: `backend/package.json` does not set `"type": "module"`, while `entrypoint.js` uses `import { execSync } from 'child_process'`; Node 24 supports ESM syntax detection in `.js` files, or `tsx` can run it).
  6. `backend/package.json` (line 8 modified):
     ```diff
     -    "start": "node dist/index.ts",
     +    "start": "node dist/index.js",
     ```
     *(Note: Line 4 `"main": "dist/index.ts"` was left as `.ts` in `origin/dev` and should also be updated to `"dist/index.js"`).*
  7. `backend/src/config/db.ts` (lines 1–17 replaced with lines 1–8):
     ```diff
      import { PrismaClient } from '@prisma/client';
     -import { neonConfig } from '@neondatabase/serverless';
     -import { PrismaNeon } from '@prisma/adapter-neon';
     -import ws from 'ws';
      import 'dotenv/config';
      
     -// Required for Neon to work in a Node/Express environment
     -neonConfig.webSocketConstructor = ws;
     -
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set in the environment variables");
      }
      
     -// We pass the configuration directly into PrismaNeon now
     -const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
     -
     -export const prisma = new PrismaClient({ adapter });
     +export const prisma = new PrismaClient();
     ```
  8. `backend/src/controllers/cycleProgress.controller.ts` (lines 22–36 modified): Removes unused variables `totalDaysInclude` and `startDate` and formats arrow function parens.
  9. `backend/src/index.ts` (lines 11, 23, 39 modified):
     ```diff
     -const PORT = process.env.PORT || 3000;
     +const PORT = Number(process.env.PORT) || 3000;
     ...
     -app.listen( PORT, () => {
     +app.listen( PORT, '0.0.0.0', () => {
     ```
  10. `docs/docker.md` (+431 lines, new file): Comprehensive Docker architecture and quick-start documentation.
  11. `frontend/.dockerignore` (+7 lines, new file).
  12. `frontend/Dockerfile.dev` (+11 lines, new file).
  13. `frontend/package.json` (line 7): Changes `"dev": "vite"` to `"dev": "vite --host"`.

---

### 1.2 Runtime, Dependencies & Database Environment

- **OS / Runtime (`run_command` observations):**
  - Node.js: `v24.22.2`
  - npm: `11.21.2`
  - `node_modules`: Not yet installed in `backend/` (`NO_NODE_MODULES`).
  - Environment files: Only `backend/.env.example` exists (`DATABASE_URL=`, `PORT=`, `JWT_SECRET=`). Neither `.env`, `backend/.env`, nor `frontend/.env` exists yet (no secrets present in workspace).
  - Docker: `docker` and `docker-compose` are **not installed** in this VM.
  - PostgreSQL: PostgreSQL 15.19 is installed (`/usr/bin/psql`, `/usr/bin/pg_isready`, `/usr/lib/postgresql/15/bin/{initdb,pg_ctl,postgres}`).
    - System cluster `15/main` (port 5432, owner `nobody`) is `down`.
    - `sudo service postgresql start` is blocked by the VM sandbox policy (`only sudo apt-get / sudo apt permitted`).
    - **Crucial finding:** `/usr/lib/postgresql/15/bin/initdb` (`15.19`) and `/usr/lib/postgresql/15/bin/pg_ctl` (`15.19`) are world-executable (`-rwxr-xr-x`) and run cleanly as user `antigravity` to spin up a local PostgreSQL 15 server on `127.0.0.1:5432` using a scratch data directory under `<appDataDir>/scratch/teamwork_tmp/<conversation-id>/pgdata`.
- **`backend/package.json` (`lines 1–42`):**
  - Dependencies: `@neondatabase/serverless` (`^1.1.0`), `@prisma/adapter-neon` (`^7.8.0`), `@prisma/client` (`^6.19.3`), `bcrypt` (`^6.0.0`), `cors` (`^2.8.6`), `express` (`^5.2.1`), `jsonwebtoken` (`^9.0.3`), `winston` (`^3.19.0`), `ws` (`^8.21.0`).
  - DevDependencies: `prisma` (`^6.19.3`), `tsx` (`^4.22.4`), `typescript` (`^6.0.3`), `dotenv` (`^17.4.2`), `@types/*`.
  - Seed config (`lines 38–40`): `"prisma": { "seed": "tsx prisma/seed.ts" }`.
- **`backend/prisma.config.ts` (`lines 1–15`):**
  - Uses `defineConfig` from `"prisma/config"` with `schema: "prisma/schema.prisma"`, `migrations: { path: "prisma/migrations" }`, `engine: "classic"`, `datasource: { url: env("DATABASE_URL") }`.
- **Prisma Schema (`backend/prisma/schema.prisma`, `lines 1–92`) & Migration (`backend/prisma/migrations/20260606191105_added_user_model/migration.sql`, `lines 1–86`):**
  - `HabitCategory` (`lines 11–21`): `id` (UUID), `name` (`@unique`), `description` (`String?`), `plans` (`PlannedAction[]`), timestamps.
  - `Cycle` (`lines 24–38`): `id` (UUID), `startDate` (`@default(now())`), `endDate` (`DateTime`), `isActive` (`@default(true)`), `logs` (`DailyLog[]`), `userId` (`String`, FK to `User.id`), timestamps.
  - `DailyLog` (`lines 41–57`): `id` (UUID), `date` (`@default(now())`), `isClosed` (`@default(false)`), `cycleId` (`String`, FK to `Cycle.id`), `plans` (`PlannedAction[]`), `userId` (`String`, FK to `User.id`), timestamps.
  - `PlannedAction` (`lines 60–76`): `id` (UUID), `description` (`String`), `isCompleted` (`@default(false)`), `logId` (`String`, FK to `DailyLog.id`), `categoryId` (`String`, FK to `HabitCategory.id`), `userId` (`String`, FK to `User.id`), timestamps.
  - `User` (`lines 79–92`): `id` (UUID), `email` (`@unique`), `hashedPassword` (`String`), relations `cycles`, `logs`, `plans`, timestamps.
- **Seed File (`backend/prisma/seed.ts`, `lines 1–38`):**
  - Instantiates `new PrismaClient()` and upserts the 8 core `HabitCategory` records by `name`:
    1. `Learning`
    2. `Physical Health`
    3. `Nutrition`
    4. `Mindfulness`
    5. `Work / Focus`
    6. `Finance`
    7. `Organization`
    8. `Rest`

---

### 1.3 File-by-File, Line-by-Line Inspection of `backend/src/`

#### 1. `backend/src/config/db.ts` (`lines 1–17`)
- **Lines 2–4, 8, 15–17:** Imports `neonConfig`, `PrismaNeon`, and `ws`, and initializes `new PrismaClient({ adapter })`.
- **Issue:** `PrismaNeon` requires a WebSocket connection to a Neon serverless proxy and fails against local or Docker PostgreSQL instances (`postgresql://localhost:5432/...` or `postgresql://db:5432/...`). Meanwhile, `origin/dev` replaces this with `export const prisma = new PrismaClient();`.

#### 2. `backend/src/config/logger.ts` (`lines 1–25`)
- Configures Winston console logger with timestamp and colorized format.
- **Note (`lines 4–6`):** When `logger.error(error)` is passed an `Error` object directly (as in `actions.controller.ts:39`), `message` works, whereas `day.controller.ts:32` and `day.controller.ts:42` have a template literal syntax bug: ``logger.error(`Error creating day: ${error as Error}.message`)`` (`.message` is outside `${}`!).

#### 3. `backend/src/index.ts` (`lines 1–60`)
- **Lines 10–23:** Creates Express `app`, mounts `corsMiddleware`, `express.json()`, and routes:
  - `/api/habits` -> `habitRoutes`
  - `/api/cycles` -> `cycleRoutes`
  - `/api/days` -> `dayRoutes`
  - `/api/cycle-progress` -> `cycleProgressRoutes`
  - `/api/actions` -> `actionRoutes`
  - `/api/auth` -> `authRoutes`
- **Lines 39–41:** Unconditionally calls `app.listen(PORT, ...)` and does **not** export `app` (making in-process testing with Supertest impossible without starting the HTTP listener on `PORT`).
- **Lines 43–60:** Dead code — exports unused, outdated interfaces `HabitCategory`, `PlannedAction` (with `habitCategoryId`, `specificGoal`), and `DailyLog` (with `isPlannedForTomorrow`).

#### 4. `backend/src/middlewares/authMiddleware.ts` (`lines 1–36`)
- **Lines 5–11:** Augments `Express.Request` with `userId?: string`.
- **Lines 13–36:** Validates `Authorization: Bearer <token>`, verifies JWT with `process.env.JWT_SECRET as string`, sets `req.userId = payload.id`, and calls `next()`. Returns `401 { success: false, message: 'Access denied' | 'Invalid or expired token.' }` on failure.

#### 5. `backend/src/middlewares/cors.ts` (`lines 1–14`)
- Allows origins `http://localhost:5173`, `https://habits-tracker-flame.vercel.app`, `https://habitstracker-web.vercel.app`, methods `GET,POST,PUT,PATCH,DELETE`, `credentials: true`.

#### 6. `backend/src/controllers/auth.controller.ts` (`lines 1–83`)
- **`register` (`lines 7–40`):**
  - Validates `email && password` (`lines 10–15`), checks uniqueness (`lines 17–23`), hashes password with `bcrypt.hash(password, 10)` (`line 25`), creates user (`line 26`).
  - **Lines 28–32:** Returns `201`:
    ```ts
    res.status( 201 ).json({
        success: true,
        message: 'User created succesfully',
        data: { id: user.id, email: user.email }
    })
    ```
    **Bug:** Does not sign or return a `token`, forcing the user in `Register.tsx:26–33` to log in manually after registering.
- **`login` (`lines 42–83`):**
  - Verifies user (`lines 52–58`) and password (`lines 60–66`), signs JWT `sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' })` (`line 68`).
  - **Lines 70–74:** Returns `200`:
    ```ts
    return res.status( 200 ).json({
        success: true,
        message: 'Login succesful',
        data: { token, email }
    })
    ```
    **Bug:** Omits `id: user.id` in `data`! `frontend/src/components/auth/Login.tsx:24–25` destructures `const { token, id, email: userEmail } = response.data.data; login(token, { id, email: userEmail });`, causing `user.id` in Zustand `authStore` to be `undefined`!

#### 7. `backend/src/controllers/cycle.controller.ts` (`lines 1–50`)
- **`startCycle` (`lines 5–33`):**
  - Checks `req.userId` (`lines 7–10`).
  - Calculates `endDate = new Date(date.getTime() + 31 * 24 * 60 * 60 * 1000)` (`lines 12–13`) and creates a `Cycle` (`lines 14–19`).
  - **Bug:** Never sets `isActive: false` on any previously active `Cycle` rows for `userId`.
- **`getCurrentCycle` (`lines 35–50`):**
  - **Line 37:** `const cycle = await prisma.cycle.findFirst();`
  - **Critical Security Bug:** Has **no `where` clause at all** (`req.userId` is completely ignored, `isActive` is ignored, `endDate` is ignored). Returns the first cycle in the entire database across all users!

#### 8. `backend/src/controllers/cycleProgress.controller.ts` (`lines 1–58`)
- **`getCycleProgress` (`lines 5–58`):**
  - **Lines 7–10:**
    ```ts
    const activeCycle = await prisma.cycle.findFirst({
        where: { endDate: { gte: new Date() } },
        orderBy: { endDate: 'desc' }
    });
    ```
  - **Critical Security & Logic Bugs:**
    1. Does not filter `activeCycle` by `userId: req.userId` or `isActive: true`.
    2. Completely ignores `req.params.cycleId` (defined in `cycleProgress.routes.ts:8` as `/:cycleId`, where frontend passes `'current'` or a specific cycle UUID).
    3. `prisma.dailyLog.findMany` (`lines 16–20`) queries `{ where: { cycleId: activeCycle.id } }` without `userId: req.userId` and includes `{ plans: true }` without `category: true`.
    4. When no active cycle exists (`lines 12–14`), returns `400 { message: 'No active cycle found to calculate stats.' }` without `success: false` (and `400` causes noisy console errors when a newly registered user simply hasn't started a cycle yet).
    5. Response (`lines 42–52`) returns `{ success: true, stats: {...}, logs }` without wrapping in `data` (though `frontend/src/services/api.ts:111–114` reads `response.data?.stats` and `response.data?.logs`, so preserving top-level `stats` & `logs` alongside `data` ensures zero regression).

#### 9. `backend/src/controllers/day.controller.ts` (`lines 1–74`)
- **`createDay` (`lines 5–35`):**
  - **Lines 12–15:** Looks up `activeCycle` with `where: { endDate: { gte: new Date() } }` — **missing `userId` and `isActive: true`**! A user's `DailyLog` can be attached to another user's `Cycle`.
  - **Lines 21–28:** Always runs `prisma.dailyLog.create({ data: { userId, date: new Date(), cycleId: activeCycle.id } })`.
  - **Bugs:**
    1. Not idempotent: calling `POST /api/days` twice on the same day creates duplicate `DailyLog` rows for that day.
    2. Does not accept `targetDate` (`'today' | 'tomorrow'` or ISO date) to support planning tomorrow's log separately from today's log.
    3. **Line 29:** `res.status(201).json(day)` returns a raw object instead of `{ success: true, data: day }`, whereas `frontend/src/services/api.ts:88` expects `return response.data?.data;` (which evaluates to `undefined`!).
    4. **Line 32:** Typo in logger template string: ``logger.error(`Error creating day: ${error as Error}.message`);``.
- **`getDays` (`lines 37–45`):**
  - **Line 39:** `const days = await prisma.dailyLog.findMany();`
  - **Critical Security Bug:** Returns every `DailyLog` in the database across all users! Also returns raw array `res.status(200).json(days)` instead of `{ success: true, data: days }` and does not include `plans`.
- **`updateDay` (`lines 47–74`):**
  - **Lines 56–63:** Queries `activeCycle` without `userId`.
  - **Lines 65–68:** `await prisma.dailyLog.update({ where: { id }, data: updateData })`.
  - **Critical Security & Product Bugs:**
    1. Does not verify `userId` ownership of the `DailyLog` being updated!
    2. Does not enforce the "Close Day" gatekeeper rule when `isClosed: true` is passed (does not check if tomorrow's goals have been planned).
    3. **Line 69:** `res.status(200).json(day)` returns a raw object instead of `{ success: true, data: day }`, breaking `frontend/src/services/api.ts:93` (`return response.data?.data;`).

#### 10. `backend/src/controllers/actions.controller.ts` (`lines 1–71`)
- **`createAction` (`lines 5–46`):**
  - **Lines 14–16:**
    ```ts
    const getLog = await prisma.dailyLog.findFirst({
        orderBy: { createdAt: 'desc' }
    })
    ```
  - **Critical Security & Product Bugs:**
    1. Queries `dailyLog.findFirst` globally with **no `where: { userId }`**! User A's action gets attached to User B's `DailyLog` if User B created a log more recently.
    2. Always attaches to the latest `DailyLog` (today's log), creating the **"Plan Tomorrow" vs. "Today's Goals" paradox**: the user opens "Plan Tomorrow" in the UI, submits a goal, and it lands in today's active checklist instead of tomorrow's log.
    3. Does not check if the target `DailyLog` has `isClosed: true`.
    4. Allows creating multiple duplicate `PlannedAction` rows for the same `(logId, categoryId)` pillar on the same day instead of upserting/updating or validating one action per pillar per day.
- **`toggleActionStatus` (`lines 48–71`):**
  - **Lines 54–57:**
    ```ts
    const action = await prisma.plannedAction.update({
        where: { id },
        data: { isCompleted }
    })
    ```
  - **Critical Security & Product Bugs:**
    1. Does not check `req.userId` ownership of the `PlannedAction`!
    2. Does not check if the parent `DailyLog.isClosed` is `true` (closed days must be immutable).
    3. Only updates `isCompleted` — does not accept `description` (Issue #6: cannot edit a daily goal's text).
    4. No `deleteAction` handler exists for `DELETE /api/actions/:id` (Issue #6).

#### 11. `backend/src/controllers/habit.controller.ts` (`lines 1–20`)
- **`getCoreHabits` (`lines 5–20`):**
  - **Lines 9 & 15:** Typo `"sucess": true` and `"sucess": false` instead of `"success"`.

#### 12. `backend/src/routes/*.routes.ts`
- `auth.routes.ts` (`lines 1–12`): `POST /register`, `POST /login` (public).
- `habit.routes.ts` (`lines 1–11`): `GET /` (`authMiddleware`, `getCoreHabits`).
- `cycle.routes.ts` (`lines 1–14`): `POST /` (`authMiddleware`, `startCycle`), `GET /` (`authMiddleware`, `getCurrentCycle`).
- `cycleProgress.routes.ts` (`lines 1–10`): `GET /:cycleId` (`authMiddleware`, `getCycleProgress`).
- `day.routes.ts` (`lines 1–16`): `POST /` (`authMiddleware`, `createDay`), `GET /` (`authMiddleware`, `getDays`), `PATCH /:id` (`authMiddleware`, `updateDay`).
- `actions.routes.ts` (`lines 1–13`): `POST /` (`authMiddleware`, `createAction`), `PATCH /:id` (`authMiddleware`, `toggleActionStatus`). Missing `DELETE /:id`.

---

## 2. Logic Chain & Technical Implementation Strategy

### 2.1 Phase 1 Strategy: Branch Consolidation, `db.ts` Compatibility, Multi-Tenancy & API Envelopes

1. **Step 1.1 — Reconcile `origin/dev` into `main` (Closes Issue #9):**
   - Because `057527a` (`main`) is a direct ancestor of `e950438` (`origin/dev`), executing `git merge origin/dev` in `/home/antigravity/GeorgeDeveloperJ/habits-tracker` performs a clean fast-forward merge bringing in `docker-compose.yml`, `backend/Dockerfile`, `backend/Dockerfile.dev`, `backend/.dockerignore`, `backend/scripts/entrypoint.js`, `docs/docker.md`, `frontend/Dockerfile.dev`, `frontend/.dockerignore`, `0.0.0.0` binding in `backend/src/index.ts`, and `"start": "node dist/index.js"` in `backend/package.json`.
   - Additionally, update `backend/package.json:4` from `"main": "dist/index.ts"` to `"main": "dist/index.js"`.

2. **Step 1.2 — Dual-Compatible `backend/src/config/db.ts`:**
   - **Observation:** `origin/dev` uses `export const prisma = new PrismaClient();`. Standard `PrismaClient` connects over TCP using `DATABASE_URL` and works with **both** local/Docker PostgreSQL (`postgresql://postgres:...@localhost:5432/...`) **and** cloud PostgreSQL providers (including Neon TCP URLs).
   - **Strategy:** Keep standard `new PrismaClient()` as the default (matching `origin/dev`), and optionally support the Neon WebSocket adapter only if `process.env.DB_ADAPTER === 'neon'` is explicitly set:
     ```ts
     import { PrismaClient } from '@prisma/client';
     import { neonConfig } from '@neondatabase/serverless';
     import { PrismaNeon } from '@prisma/adapter-neon';
     import ws from 'ws';
     import 'dotenv/config';

     if (!process.env.DATABASE_URL) {
       throw new Error('DATABASE_URL is not set in the environment variables');
     }

     const createPrismaClient = () => {
       if (process.env.DB_ADAPTER === 'neon') {
         neonConfig.webSocketConstructor = ws;
         const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
         return new PrismaClient({ adapter });
       }
       return new PrismaClient();
     };

     export const prisma = createPrismaClient();
     ```
   - This guarantees 100% compatibility with Docker (`origin/dev`), local VM PostgreSQL 15, and Neon serverless.

3. **Step 1.3 — Enforce Strict `userId` Isolation Across All Controllers:**
   - **`backend/src/controllers/cycle.controller.ts`:**
     - In `startCycle` (`lines 12–19`): Before creating a new cycle, deactivate any existing active cycles for `userId`:
       ```ts
       await prisma.cycle.updateMany({
         where: { userId, isActive: true },
         data: { isActive: false }
       });
       ```
       Optionally accept initial Day 1 actions or auto-create Day 1's `DailyLog` so the sprint starts ready to use.
     - In `getCurrentCycle` (`lines 35–49`): Require `req.userId`. Query:
       ```ts
       const cycle = await prisma.cycle.findFirst({
         where: {
           userId,
           isActive: true,
           endDate: { gte: new Date() }
         },
         orderBy: { createdAt: 'desc' }
       });
       ```
       Also support `GET /api/cycles/history` (or `?history=true`) returning all cycles for `userId` ordered by `startDate: 'desc'` for Phase 4 Sprint History.
   - **`backend/src/controllers/cycleProgress.controller.ts`:**
     - Require `req.userId`.
     - Inspect `const { cycleId } = req.params;`:
       - If `cycleId && cycleId !== 'current'`, query `prisma.cycle.findFirst({ where: { id: cycleId, userId } })`.
       - Otherwise (`!cycleId || cycleId === 'current'`), query `prisma.cycle.findFirst({ where: { userId, isActive: true, endDate: { gte: new Date() } }, orderBy: { endDate: 'desc' } })`.
     - If no cycle is found: if `cycleId && cycleId !== 'current'`, return `404 { success: false, message: 'Cycle not found' }`; if `'current'`, return `200 { success: true, data: null, stats: null, logs: [] }` (or `400 { success: false, message: 'No active cycle found to calculate stats.' }`—note `api.ts:108–118` catches errors and returns `null`, or if `200` with `stats: null` is returned, check `HabitContext.tsx`). Keeping `404`/`400` with `{ success: false, message: ... }` or handling `null` cleanly in `api.ts` works seamlessly.
     - Scope `dailyLog.findMany` by `{ where: { cycleId: targetCycle.id, userId }, include: { plans: { include: { category: true } } }, orderBy: { date: 'asc' } }`.
   - **`backend/src/controllers/day.controller.ts`:**
     - Require `req.userId` in `createDay`, `getDays`, and `updateDay`.
     - In `getDays`: `prisma.dailyLog.findMany({ where: { userId, ...(cycleId ? { cycleId } : {}) }, include: { plans: true }, orderBy: { date: 'asc' } })`.
     - In `updateDay`: First find the log with `prisma.dailyLog.findFirst({ where: { id, userId }, include: { plans: true } })`. If not found, return `404 { success: false, message: 'Daily log not found' }`.
   - **`backend/src/controllers/actions.controller.ts`:**
     - Require `req.userId` in `createAction`, `updateAction` / `toggleActionStatus`, and `deleteAction`.
     - Verify ownership of target `DailyLog` (`where: { id: logId, userId }`) and `PlannedAction` (`where: { id, userId }`) before any mutation.

4. **Step 1.4 — Fix Auth Flow (`backend/src/controllers/auth.controller.ts`):**
   - In `register` (`lines 26–32`): Sign a JWT token immediately after `prisma.user.create`:
     ```ts
     const token = sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
     return res.status(201).json({
       success: true,
       message: 'User created successfully',
       data: { token, id: user.id, email: user.email }
     });
     ```
   - In `login` (`lines 68–74`): Include `id: user.id` in `data`:
     ```ts
     return res.status(200).json({
       success: true,
       message: 'Login successful',
       data: { token, id: user.id, email: user.email }
     });
     ```

5. **Step 1.5 — Standardize API Envelopes, Fix Typo & Clean Dead Code:**
   - `backend/src/controllers/habit.controller.ts` (`lines 9, 15`): Fix `"sucess"` -> `"success"`.
   - `backend/src/controllers/day.controller.ts`: Wrap responses in `{ success: true, message?: string, data: day | days }`, and wrap errors in `{ success: false, message: '...' }`. Fix logger template string typos on `lines 32, 42`.
   - `backend/src/controllers/cycleProgress.controller.ts`: Return `{ success: true, data: { stats, logs, pillarStats, dailySeries, recentActivity }, stats, logs, pillarStats, dailySeries, recentActivity }` so both `response.data.data` and legacy `response.data.stats` / `response.data.logs` consumers work without breaking!
   - `backend/src/index.ts`: Remove dead interfaces at `lines 43–60`. Export `app` (`export { app }; export default app;`) and only run `app.listen` when `process.env.NODE_ENV !== 'test'` so integration tests can import `app` directly.

---

### 2.2 Phase 2 Strategy: Proactive 31-Day Engine, Today vs. Tomorrow Separation & Close Day Gatekeeper

1. **Step 2.1 — Separate "Today's Execution" from "Tomorrow's Proactive Plan" (`day.controller.ts` & `actions.controller.ts`):**
   - **Date Boundary Helper:** Define a consistent UTC/calendar day normalization helper (`getDayBounds(target: 'today' | 'tomorrow' | Date)` returning `{ startOfDay, endOfDay, targetDate }`):
     - For `'today'`: `startOfDay` = today `00:00:00.000`, `endOfDay` = today `23:59:59.999`.
     - For `'tomorrow'`: `startOfDay` = tomorrow (`+1 day`) `00:00:00.000`, `endOfDay` = tomorrow `23:59:59.999`.
   - **Idempotent `createDay` (`POST /api/days`):**
     - Accepts `{ cycleId?: string, targetDate?: 'today' | 'tomorrow' | string }`.
     - Resolves the user's active cycle (`where: { userId, isActive: true, endDate: { gte: new Date() } }`).
     - Computes `{ startOfDay, endOfDay, targetDate }` (defaults to `'today'`).
     - Checks if a `DailyLog` already exists for `{ userId, cycleId: activeCycle.id, date: { gte: startOfDay, lte: endOfDay } }` (including `{ plans: true }`).
     - If it exists, returns `200 { success: true, message: 'Daily log already exists', data: existingLog }` (idempotent!).
     - If it does not exist, creates it with `date: targetDate` and returns `201 { success: true, message: 'Daily log created successfully', data: newLog }`.
   - **Target-Aware `createAction` (`POST /api/actions`):**
     - Accepts `{ categoryId: string, description: string, logId?: string, targetDate?: 'today' | 'tomorrow' }`.
     - **Resolution logic for target `DailyLog`:**
       1. If `logId` is provided: find `DailyLog` with `{ id: logId, userId }`.
       2. Else if `targetDate === 'tomorrow'` or `targetDate === 'today'`: find or **auto-create** the `DailyLog` for that calendar day in the user's active cycle!
       3. Else (default fallback when neither `logId` nor `targetDate` is specified): find or auto-create `'today'`'s `DailyLog` if today has not been closed yet; if today's log is already closed, target `'tomorrow'`'s `DailyLog`.
     - **Guard:** If the resolved `DailyLog` has `isClosed === true`, return `400 { success: false, message: 'Cannot add or modify actions on a closed day.' }`.
     - **Day 1 Onboarding Support:** On Day 1 of a sprint (or whenever today's log is not closed), users can pass `targetDate: 'today'` (or batch-create Day 1 goals during Sprint Kickoff) to populate Today's 8 Pillar Goals immediately, while `targetDate: 'tomorrow'` populates Tomorrow's 8 Pillar Plan!
     - **Upsert per Pillar per Day (Preventing Duplicate Pillar Actions):** If a `PlannedAction` already exists for `{ userId, logId: targetLog.id, categoryId }`, update its `description` rather than creating a duplicate row for the same pillar on the same day (or if `replace !== false`, update in place). This makes inline planning for each of the 8 pillars idempotent and clean.

2. **Step 2.2 — Edit & Delete Daily Goals (`PATCH /api/actions/:id` & `DELETE /api/actions/:id`, Closes Issue #6):**
   - **`updateAction` / `toggleActionStatus` (`PATCH /api/actions/:id` in `actions.controller.ts`):**
     - Accepts `{ description?: string, isCompleted?: boolean }`.
     - Looks up `existing = await prisma.plannedAction.findFirst({ where: { id, userId }, include: { dailyLog: true } })`.
     - If `!existing`, return `404 { success: false, message: 'Action not found' }`.
     - If `existing.dailyLog.isClosed`, return `400 { success: false, message: 'Cannot modify actions on a closed day' }`.
     - Builds `updateData`: if `typeof description === 'string' && description.trim()`, sets `updateData.description = description.trim()`; if `typeof isCompleted === 'boolean'`, sets `updateData.isCompleted = isCompleted`.
     - Updates and returns `200 { success: true, message: 'Action updated successfully', data: updatedAction }`.
   - **`deleteAction` (`DELETE /api/actions/:id` in `actions.controller.ts` & `actions.routes.ts`):**
     - Looks up `existing = await prisma.plannedAction.findFirst({ where: { id, userId }, include: { dailyLog: true } })`.
     - If `!existing`, return `404 { success: false, message: 'Action not found' }`.
     - If `existing.dailyLog.isClosed`, return `400 { success: false, message: 'Cannot delete actions from a closed day' }`.
     - Deletes with `await prisma.plannedAction.delete({ where: { id } })` and returns `200 { success: true, message: 'Action deleted successfully', data: { id } }`.

3. **Step 2.3 — "Close Day" Gatekeeper (`PATCH /api/days/:id` in `day.controller.ts`):**
   - Look up `day = await prisma.dailyLog.findFirst({ where: { id, userId }, include: { plans: true, cycle: true } })`.
   - If `!day`, return `404 { success: false, message: 'Daily log not found' }`.
   - When `req.body.isClosed === true` and `!day.isClosed`:
     - Determine if this is Day 31 (final day of the sprint): e.g., `diffDays >= 31` or `tomorrow > day.cycle.endDate`.
     - If not the final day of the sprint, check tomorrow's `DailyLog` for `{ userId, cycleId: day.cycleId, date: { gte: tomorrowStart, lte: tomorrowEnd } }` with `{ include: { plans: true } }`.
     - Count distinct planned `categoryId`s with non-empty descriptions in tomorrow's log: `const plannedPillarsCount = new Set(tomorrowLog?.plans.map(p => p.categoryId) ?? []).size;`.
     - **Gatekeeper Threshold:** Enforce `requiredPillars = Number(process.env.REQUIRED_TOMORROW_PILLARS ?? 8)` (defaulting to all `8` core pillars per `README.md:27` *"You cannot 'close' today until you have planned actionable tasks for tomorrow's 8 pillars"*, while allowing `req.body.forceClose` or configurable env override if needed). If `plannedPillarsCount < requiredPillars`, return `400`:
       ```json
       {
         "success": false,
         "message": "You must plan tomorrow's 8 core pillars before closing today (currently planned: X/8).",
         "data": { "plannedPillarsCount": 3, "requiredPillars": 8 }
       }
       ```
   - Update `DailyLog` (`isClosed`) and return `200 { success: true, message: 'Daily log updated successfully', data: updatedDay }`.

---

### 2.3 Phase 4 Backend Strategy: Live Analytics, Zod Validation & Integration Testing

1. **Step 4.1 — Live Analytics & Sprint History Extensions (`cycleProgress.controller.ts` & `cycle.controller.ts`):**
   - Inspecting `origin/frontend/dashboard:frontend/src/pages/AnalyticsDashboard.tsx` and Roadmap Section 3.2 / 4.1 shows the frontend needs:
     1. **Summary KPI Cards (`stats`):**
        - `cycleId`: string
        - `startDate`: ISO string
        - `endDate`: ISO string
        - `isActive`: boolean
        - `currentDayNumber`: number (`1..31`)
        - `totalDays`: `31`
        - `daysLogged`: number
        - `closedDays`: number
        - `totalActions`: number
        - `completedActions`: number
        - `skippedActions`: number
        - `overallCompletionRate`: number (`0..100`)
        - `currentStreak`: number (consecutive days up to today with `>= 1` completed action or closed day)
        - `bestStreak`: number
        - `todayPlannedCount`: number (`0..8`)
        - `todayCompletedCount`: number (`0..8`)
        - `tomorrowPlannedCount`: number (`0..8`)
        - `canCloseToday`: boolean (`tomorrowPlannedCount >= 8`)
     2. **8-Pillar Balance / Radar & Breakdown Table (`pillarStats`):**
        - Query all 8 `HabitCategory` records and aggregate the cycle's `PlannedAction` records by `categoryId`:
          ```ts
          export interface PillarStat {
            categoryId: string;
            categoryName: string;
            description: string | null;
            plannedCount: number;
            completedCount: number;
            skippedCount: number;
            completionRate: number; // 0..100
            currentStreak: number;  // consecutive logged days where this pillar was completed
          }
          ```
     3. **31-Day Consistency Series (`dailySeries`):**
        - Array for each logged day (and/or 31-day slot `dayNumber: 1..31`):
          ```ts
          export interface DailySeriesPoint {
            dayNumber: number;
            date: string;
            logId: string | null;
            isClosed: boolean;
            isToday: boolean;
            isTomorrow: boolean;
            planned: number;
            completed: number;
            skipped: number;
            completionRate: number;
          }
          ```
     4. **Recent Activity Feed (`recentActivity`):**
        - Latest 10 actions/events sorted by `updatedAt` descending (`id`, `type: 'completed' | 'planned'`, `description`, `categoryName`, `timestamp`).
     5. **Today & Tomorrow Convenience Pointers (`todayLog`, `tomorrowLog`):**
        - Explicitly return `todayLog` and `tomorrowLog` in the `getCycleProgress` payload so `HabitContext.tsx` does not misidentify `tomorrowLog` (`logs[logs.length - 1]`) as `todayLog` once tomorrow's log is created!
        - **Critical observation on `HabitContext.tsx:36–49`:** Currently, `getTodayLogFromLogs` only checks `const latestLog = logs[logs.length - 1]`. Once a user creates tomorrow's log (which has a later `date` than today's log), `logs[logs.length - 1]` is **tomorrow's** log, so `new Date(latestLog.date).toDateString() === today` evaluates to `false` and `getTodayLogFromLogs` returns `null`! Finding today's log with `.find()` by matching calendar date (and returning `todayLog` and `tomorrowLog` directly from both backend and `HabitContext`) solves this completely!

2. **Step 4.2 — Zod Validation Middleware (`backend/src/middlewares/validate.ts`):**
   - Install `zod` in `backend/package.json`.
   - Create `backend/src/middlewares/validate.ts` with reusable schemas and Express middleware that returns `400 { success: false, message: firstIssue.message, errors: result.error.issues }`:
     - `authRegisterSchema` / `authLoginSchema`: `{ email: z.string().email(), password: z.string().min(6) }`
     - `createActionSchema`: `{ categoryId: z.string().uuid(), description: z.string().trim().min(1).max(500), logId: z.string().uuid().optional(), targetDate: z.enum(['today', 'tomorrow']).optional() }`
     - `updateActionSchema`: `{ description: z.string().trim().min(1).max(500).optional(), isCompleted: z.boolean().optional() }.refine(d => d.description !== undefined || d.isCompleted !== undefined)`
     - `createDaySchema`: `{ cycleId: z.string().uuid().optional(), targetDate: z.enum(['today', 'tomorrow']).optional() }`
     - `updateDaySchema`: `{ isClosed: z.boolean(), forceClose: z.boolean().optional() }`

3. **Step 4.3 — Reliable Backend Multi-Tenant & Integration Testing in This VM:**
   - **How tests run reliably in this VM without Docker or `sudo`:**
     1. Initialize a temporary PostgreSQL 15 cluster under `/home/antigravity/.gemini/jetski/scratch/teamwork_tmp/<conversation-id>/pgdata` (per Disk Hygiene rules, never `/tmp`):
        ```bash
        PG_BASE="/home/antigravity/.gemini/jetski/scratch/teamwork_tmp/5e929c32a75872b1b18af69eec215582/pg"
        mkdir -p "$PG_BASE/data" "$PG_BASE/run"
        /usr/lib/postgresql/15/bin/initdb -D "$PG_BASE/data" -U postgres --auth=trust --no-instructions
        /usr/lib/postgresql/15/bin/pg_ctl -D "$PG_BASE/data" -l "$PG_BASE/postgres.log" -o "-k $PG_BASE/run -p 5432" start
        psql -h 127.0.0.1 -p 5432 -U postgres -c "CREATE DATABASE habits_tracker_db;"
        ```
     2. Configure `backend/.env` with:
        ```env
        DATABASE_URL="postgresql://postgres@127.0.0.1:5432/habits_tracker_db?schema=public"
        PORT=3000
        JWT_SECRET="super-secret-jwt-key-for-dev-and-test"
        ```
     3. Run `npx prisma migrate deploy && npx prisma db seed` inside `backend/`.
     4. Run integration tests (using Node's built-in test runner `node --import tsx --test tests/*.test.ts` or `vitest` + `supertest`) verifying:
        - User A registration (`201` with `{ token, id, email }`) & login (`200` with `{ token, id, email }`).
        - User A starts a cycle, creates Day 1 (idempotency verified on second `POST /api/days`), plans Today's 8 pillars, toggles completion, edits description (`PATCH /api/actions/:id`), deletes an action (`DELETE /api/actions/:id`).
        - User B registers and cannot read or mutate User A's cycle (`GET /api/cycles`), progress (`GET /api/cycle-progress/current`), daily logs (`GET /api/days`, `PATCH /api/days/:id`), or planned actions (`PATCH /api/actions/:id`, `DELETE /api/actions/:id`).
        - "Close Day" gatekeeper rejects `PATCH /api/days/:id { isClosed: true }` when tomorrow has `< 8` planned pillars (`400`), and succeeds (`200`) once all 8 pillars are planned for tomorrow (`POST /api/actions` with `targetDate: 'tomorrow'`).
        - Closed day rejects subsequent `POST /api/actions`, `PATCH /api/actions/:id`, and `DELETE /api/actions/:id` targeting that closed day (`400`).

---

## 3. Caveats

1. **VM Sandbox Sudo Restriction:** `sudo service postgresql start` is disallowed by the VM sandbox policy (which only permits `sudo apt-get` / `sudo apt`). Therefore, any implementer or test runner agent starting PostgreSQL locally in the VM must use `/usr/lib/postgresql/15/bin/initdb` and `/usr/lib/postgresql/15/bin/pg_ctl` as user `antigravity` with a user-owned directory under `/home/antigravity/.gemini/jetski/scratch/teamwork_tmp/...` rather than `sudo service postgresql`.
2. **Existing Password Validation Compatibility:** If Zod validation is added to `/api/auth/login`, keep password validation on login as `z.string().min(1)` (and `z.string().min(6)` on `/api/auth/register`) so any existing short test passwords in login tests return `401 Invalid credentials` rather than `400` validation errors unless empty.
3. **`HabitContext.tsx` `getTodayLogFromLogs` Bug When Tomorrow's Log Exists:** Once `POST /api/days` or `POST /api/actions` creates tomorrow's `DailyLog`, `progress.logs` (ordered by `date: 'asc'`) will have tomorrow's log at `logs[logs.length - 1]`. Both backend (`getCycleProgress` returning `todayLog` and `tomorrowLog`) and frontend (`HabitContext.tsx` using `.find()` instead of `logs[logs.length - 1]`) must be updated together in Phase 2.

---

## 4. Conclusion

The backend architecture and git branch state are clear and ready for implementation:
1. **Merge `origin/dev` (`e950438`) into `main` (`057527a`)** via fast-forward merge, update `backend/package.json` `"main": "dist/index.js"`, and make `backend/src/config/db.ts` default to standard `PrismaClient()` (with optional `DB_ADAPTER === 'neon'` fallback).
2. **Fix all P0 Multi-Tenancy & Auth Bugs (Phase 1):** Scope all queries in `cycle.controller.ts`, `cycleProgress.controller.ts`, `day.controller.ts`, and `actions.controller.ts` by `req.userId`; return `{ token, id: user.id, email: user.email }` on both `register` and `login`; fix `"sucess"` in `habit.controller.ts`; standardize `{ success, message?, data }` envelopes across `day.controller.ts` and `cycleProgress.controller.ts`; remove dead interfaces in `backend/src/index.ts` and export `app`.
3. **Implement the Proactive 31-Day Engine (Phase 2):** Make `POST /api/days` idempotent per calendar day with `targetDate: 'today' | 'tomorrow'`; support `targetDate` / `logId` and pillar upsert in `POST /api/actions`; expand `PATCH /api/actions/:id` to update `{ description?, isCompleted? }` with `userId` ownership and `!dailyLog.isClosed` checks; add `DELETE /api/actions/:id`; and enforce the 8-pillar tomorrow planning gatekeeper on `PATCH /api/days/:id` when closing today.
4. **Deliver Live Analytics, Zod Validation & Integration Tests (Phase 4 Backend):** Extend `GET /api/cycle-progress/:cycleId` to support `'current'` or specific `cycleId`, returning `stats`, `pillarStats` (per-pillar completion & streaks), `dailySeries` (31-day consistency array), `recentActivity`, `todayLog`, and `tomorrowLog`; add `GET /api/cycles/history`; add Zod request validation middleware; and run automated multi-tenant & proactive engine integration tests against a user-space PostgreSQL 15 instance.

---

## 5. Verification Method

To independently verify the findings in this report and validate the subsequent implementation:

1. **Verify Git Branch & Diff State:**
   ```bash
   git log --oneline --graph main origin/dev -n 12
   git diff --stat main...origin/dev
   ```
2. **Verify TypeScript Compilation & Prisma Schema:**
   ```bash
   cd /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend
   npm install
   npx prisma generate
   npm run typecheck
   ```
3. **Verify User-Space PostgreSQL 15 & Integration Test Suite (Post-Implementation):**
   ```bash
   PG_BASE="/home/antigravity/.gemini/jetski/scratch/teamwork_tmp/5e929c32a75872b1b18af69eec215582/pg"
   mkdir -p "$PG_BASE/data" "$PG_BASE/run"
   /usr/lib/postgresql/15/bin/initdb -D "$PG_BASE/data" -U postgres --auth=trust --no-instructions
   /usr/lib/postgresql/15/bin/pg_ctl -D "$PG_BASE/data" -l "$PG_BASE/postgres.log" -o "-k $PG_BASE/run -p 5432" start
   psql -h 127.0.0.1 -p 5432 -U postgres -c "CREATE DATABASE habits_tracker_db;"
   cd /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend
   npx prisma migrate deploy
   npx prisma db seed
   npm test
   ```
4. **Invalidation Conditions:**
   - Any controller query on `Cycle`, `DailyLog`, or `PlannedAction` that omits `userId: req.userId` invalidates multi-tenant isolation.
   - Any response from `day.controller.ts` or `habit.controller.ts` that omits `success: boolean` or `data` invalidates frontend `api.ts` envelope unwrapping.
