# Handoff Report — Forgot Password Architecture & Auth Audit (`explorer_auth_2`)

**Executive Summary:** On commit `bb6ddeb`, authentication supports only `POST /api/auth/register` and `POST /api/auth/login` (Zod + `bcrypt` + stateless 7d JWT), with no password reset schema, endpoints, SMTP dependencies, or UI routes. The cleanest, self-contained, non-cheating design is a dedicated `PasswordResetToken` Prisma model (storing SHA-256 `tokenHash`, `expiresAt`, `usedAt`, `onDelete: Cascade`) paired with `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`, anti-enumeration `200` responses in production, environment-gated `resetToken` delivery in non-production/test (`NODE_ENV !== 'production' || EXPOSE_RESET_TOKEN === 'true'`), and `/forgot-password` + `/reset-password` React routes linked from `/login`.

---

## 1. Observation

### 1.1 Git & Workspace Baseline
- `git rev-parse --short HEAD` returned `bb6ddeb`.
- Working directory contains `backend/` (Express 5 + Prisma 6 + TypeScript) and `frontend/` (React 19 + Vite 8 + Tailwind CSS v4 + Zustand + React Router v7).

### 1.2 Prisma Schema, Migrations & Docker Entrypoint
- **`backend/prisma/schema.prisma:1-92`**:
  - `User` model (`lines 79-92`): `id String @id @default(uuid())`, `email String @unique`, `hashedPassword String`, relations `cycles Cycle[]`, `logs DailyLog[]`, `plans PlannedAction[]`, `createdAt`, `updatedAt`. No password reset fields or token model exist.
  - Existing relations (`Cycle`, `DailyLog`, `PlannedAction`) do not specify `onDelete: Cascade` (`schema.prisma:34,47,53,66,69,72`).
- **`backend/prisma/migrations/`**:
  - Contains only `20260606191105_added_user_model/migration.sql` and `migration_lock.toml`.
  - `migration.sql:70-85` uses `ON DELETE RESTRICT ON UPDATE CASCADE` for all foreign keys to `"User"`.
- **`backend/scripts/entrypoint.js:1-10`**:
  - Line 4 runs `execSync('npx prisma migrate deploy', { stdio: 'inherit' });`, line 7 runs `npx prisma db seed`, line 10 runs `npm run dev`.
- **`backend/Dockerfile:11` & `backend/Dockerfile.dev:9`**:
  - Both run `npx prisma generate`. `Dockerfile.dev` does not set `NODE_ENV=production`.
- **`backend/prisma.config.ts:5-14`**:
  - Points to `schema: "prisma/schema.prisma"`, `migrations: { path: "prisma/migrations" }`, `datasource: { url: env("DATABASE_URL") }`.

### 1.3 Backend Auth, Validation & Server Config
- **`backend/package.json:16-39`**:
  - Dependencies: `@neondatabase/serverless`, `@prisma/adapter-neon`, `@prisma/client`, `bcrypt` (`^6.0.0`), `cors`, `express` (`^5.2.1`), `jsonwebtoken` (`^9.0.3`), `winston` (`^3.19.0`), `ws`, `zod` (`^3.24.2`).
  - No email/SMTP packages (`nodemailer`, `resend`, etc.) and no `express-rate-limit`.
- **`backend/tsconfig.json:2-13`**:
  - `"types": ["node"]`, `"target": "ES2022"`, `"module": "NodeNext"`, `"strict": true` — Node's built-in `node:crypto` is available with zero new dependencies.
- **`backend/.env.example:1-10`**:
  - Defines only `DATABASE_URL`, `PORT`, `JWT_SECRET`.
- **`backend/src/index.ts:10-46`**:
  - Mounts `corsMiddleware`, `express.json()`, and `app.use('/api/auth', authRoutes)` at line 23.
  - Only calls `app.listen(PORT, '0.0.0.0', ...)` when `process.env.NODE_ENV !== 'test'` (`lines 39-43`), exporting `app` (`lines 45-46`).
- **`backend/src/routes/auth.routes.ts:1-13`**:
  - Line 8: `router.post('/register', validate(registerSchema), register);`
  - Line 11: `router.post('/login', validate(loginSchema), login);`
- **`backend/src/controllers/auth.controller.ts:1-88`**:
  - `register` (`lines 7-43`): trims `email` (`line 9`, no `.toLowerCase()`), checks uniqueness (`line 19`), hashes password with `bcrypt.hash(password, 10)` (`line 27`), signs 7d JWT `{ id: user.id }` (`line 29`), returns `201` `{ success: true, message: 'User created successfully', data: { token, id: user.id, email: user.email } }` (`lines 31-35`).
  - `login` (`lines 45-88`): trims `email` (`line 47`), finds user by exact `email` (`line 57`), verifies with `bcrypt.compare` (`line 65`), returns `401` `{ success: false, message: 'Invalid credentials' }` on failure (`lines 59-62, 67-70`), or `200` `{ success: true, message: 'Login successful', data: { token, id: user.id, email: user.email } }` (`lines 75-79`).
- **`backend/src/middlewares/validate.ts:4-40`**:
  - `validate(schema)` parses `req.body ?? {}`, replaces `req.body = result.data`, and on failure returns `400` `{ success: false, message: firstIssue?.message || 'Validation failed', errors: result.error.issues }`.
  - `registerSchema` (`lines 20-29`): valid trimmed email, `password` min 6 characters.
  - `loginSchema` (`lines 31-40`): valid trimmed email, `password` min 1 character.
- **`backend/src/middlewares/authMiddleware.ts:13-36`**:
  - Verifies `Bearer <token>` via `jsonwebtoken.verify(token, process.env.JWT_SECRET as string)` and sets `req.userId = payload.id` (`lines 24-26`). Does not check DB user state or token version/timestamp.

### 1.4 Frontend Auth, Routing, API Client & Store
- **`frontend/src/App.tsx:1-34`**:
  - Public routes (`lines 13-14`): `/login` (`<Login />`), `/register` (`<Register />`).
  - Protected routes (`lines 16-25`): `/` (`<Tracker />`), `/analytics` (`<AnalyticsDashboard />`) inside `<ProtectedRoute><AppLayout /></ProtectedRoute>`.
  - Catch-all (`line 27`): `<Route path="*" element={<Navigate to="/" replace />} />`.
- **`frontend/src/store/authStore.ts:1-29`**:
  - Persists `{ token: string | null, user: { id, email } | null }` under `'auth-storage'` in `localStorage`.
- **`frontend/src/api/client.ts:4-36`**:
  - `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'`.
  - Response interceptor (`lines 30-35`): **any `401` response triggers `useAuthStore.getState().logout()`**.
- **`frontend/src/services/api.ts:1-256`**:
  - Typed interfaces and wrappers for habits, cycles, days, cycle-progress, and actions. Currently has no auth helper functions (`Login.tsx` and `Register.tsx` call `apiClient.post('/auth/...')` directly).
- **`frontend/src/components/auth/Login.tsx:10-282`**:
  - Exports `AuthShowcasePanel` (`lines 10-111`) used by both `Login` and `Register`.
  - `Login` redirects to `/` if `token` is truthy (`lines 123-127`).
  - Form (`lines 188-254`) has `#login-email` (`lines 196-205`), `#login-password` (`lines 215-224`), error alert (`lines 227-234`), and `#login-submit-btn` (`lines 236-253`). Footer (`lines 256-265`) links only to `/register`. There is no "Forgot password?" link or button.
  - Uses UI primitives `Input` (`frontend/src/components/ui/input.tsx:6-20`) and `Button` (`frontend/src/components/ui/button.tsx:10-48`).
- **`frontend/src/components/auth/Register.tsx:10-205`**:
  - Mirrors `Login.tsx` split-screen layout with `email`, `password` (min 6), and `confirmPassword` validation (`lines 31-42`).

### 1.5 E2E Test Suite & Cleanup Conventions
- **`backend/tests/e2e.test.ts:1-1207`**:
  - Sets `process.env.NODE_ENV = 'test'` on `line 6` before importing `app`.
  - Uses `node:test` + `node:assert/strict` + native `fetch` against ephemeral `app.listen(0, '127.0.0.1')` (`lines 107-115`).
  - `cleanupTestUsers()` (`lines 70-87`) explicitly deletes `plannedAction`, `dailyLog`, `cycle`, then `user` in FK order.
  - Contains 40 tests across Tier 1 (`lines 131-437`), Tier 2 (`lines 442-656`), Tier 3 (`lines 661-841`), and Tier 4 (`lines 846-1205`). Auth tests currently cover `register`, `login`, email trimming, invalid email/short password/duplicate email/wrong password, and JWT protection (`lines 132-199, 443-489`).

---

## 2. Logic Chain

1. **Migration compatibility requirement:** Because `backend/scripts/entrypoint.js:4` runs `npx prisma migrate deploy` on startup, any schema addition must include a committed SQL migration directory under `backend/prisma/migrations/` (not just `prisma db push`).
2. **Dedicated table vs. columns on `User`:** Adding a `PasswordResetToken` model with `tokenHash @unique`, `userId`, `expiresAt`, `usedAt`, and `onDelete: Cascade` keeps `User` clean, provides an audit trail (`createdAt`, `usedAt`), enables O(1) indexed SHA-256 lookup (`findUnique({ where: { tokenHash } })`), supports single-use atomic claiming (`updateMany` where `usedAt: null, expiresAt: { gt: now }`), and prevents FK deletion errors in `e2e.test.ts:cleanupTestUsers()` even before explicit cleanup lines are added.
3. **Why SHA-256 instead of bcrypt for reset tokens:** Reset tokens are generated with 256 bits of CSPRNG entropy (`crypto.randomBytes(32).toString('hex')`), making offline brute-force infeasible. Hashing with SHA-256 allows deterministic `WHERE "tokenHash" = $1` unique lookup without scanning or embedding token IDs, while still protecting tokens at rest if the database is compromised.
4. **Solving "no external SMTP" without cheating:** `backend/package.json` has no mailer dependency and `.env.example` has no SMTP configuration. Hardcoding a fixed code or skipping token verification would cheat. Instead:
   - Always generate, hash, persist, expire, and single-use-consume real tokens in PostgreSQL.
   - Return a uniform `200` anti-enumeration message on `POST /api/auth/forgot-password` regardless of whether the email exists.
   - Gate returning `data: { resetToken, expiresAt }` (and logging the reset URL via `logger.info`) behind `process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_TOKEN === 'true'`. Because `e2e.test.ts:6` sets `NODE_ENV = 'test'` and `Dockerfile.dev` leaves `NODE_ENV` unset, local development, Docker Compose demoing, and automated E2E tests work seamlessly end-to-end, while production (`NODE_ENV=production`) never leaks tokens over HTTP.
5. **Status code hygiene with Axios interceptor:** Because `frontend/src/api/client.ts:31-33` logs out the user on any `401`, `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` must remain public (no `authMiddleware`) and must return `400` (not `401`) for invalid, expired, or already-used reset tokens.
6. **Frontend UX alignment:** `Login.tsx` lacks a "Forgot password?" link (`lines 208-225`), and `App.tsx` catches unknown paths (`*`) and redirects to `/` -> `/login` (`line 27`). Registering public `/forgot-password` and `/reset-password` routes in `App.tsx`, adding the link on `Login.tsx`, and rendering a conditional "Local / Demo Reset Link Ready" action card when `response.data?.resetToken` is present delivers a complete, zero-friction UI flow while keeping a manual token input fallback on `/reset-password`.

---

## 3. Recommended Concrete Implementation Strategy

### 3.1 Prisma Schema & Migration (`backend/prisma/schema.prisma`)
Add relation on `User` and new `PasswordResetToken` model:
```prisma
model User {
  id                  String               @id @default(uuid())
  email               String               @unique
  hashedPassword      String
  cycles              Cycle[]
  logs                DailyLog[]
  plans               PlannedAction[]
  passwordResetTokens PasswordResetToken[]
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```
- Generate migration: `npx prisma migrate dev --name add_password_reset_tokens` (creates `backend/prisma/migrations/<timestamp>_add_password_reset_tokens/migration.sql` with `CREATE TABLE "PasswordResetToken"`, `UNIQUE INDEX "PasswordResetToken_tokenHash_key"`, indexes on `userId` and `expiresAt`, and `ON DELETE CASCADE` FK to `"User"`).

### 3.2 Validation Schemas (`backend/src/middlewares/validate.ts`)
Add alongside `registerSchema` / `loginSchema`:
- `forgotPasswordSchema`:
  ```ts
  export const forgotPasswordSchema = z.object({
    email: z
      .string({ required_error: 'Email is required.' })
      .trim()
      .min(1, 'Email is required.')
      .email('Invalid email address.'),
  });
  ```
- `resetPasswordSchema`:
  ```ts
  export const resetPasswordSchema = z.object({
    token: z
      .string({ required_error: 'Reset token is required.' })
      .trim()
      .min(1, 'Reset token is required.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(6, 'Password must be at least 6 characters long.'),
  });
  ```

### 3.3 Backend Routes & Controller (`backend/src/routes/auth.routes.ts`, `backend/src/controllers/auth.controller.ts`)
- **Routes (`auth.routes.ts`)**:
  - `router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);`
  - `router.post('/reset-password', validate(resetPasswordSchema), resetPassword);`
- **Controller (`auth.controller.ts`)**:
  - Helper using Node built-in `crypto`:
    - `rawToken = crypto.randomBytes(32).toString('hex')`
    - `hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')`
    - TTL: `Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 15` minutes (`expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)`).
    - `exposeToken = process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_TOKEN === 'true'`.
  - **`forgotPassword`**:
    1. Read trimmed `email = req.body.email`. Look up `prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })`.
    2. Uniform message: `'If an account with that email exists, password reset instructions have been generated.'`
    3. If `!user`: return `200` `{ success: true, message, data: null }`.
    4. If `user`: inside `prisma.$transaction`:
       - Invalidate prior unused tokens for `user.id` (`updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } })`).
       - Create new `PasswordResetToken` with `{ userId: user.id, tokenHash: hashResetToken(rawToken), expiresAt }`.
    5. If `exposeToken`: log `logger.info(\`Password reset link for ${user.email}: /reset-password?token=${rawToken}\`)` and return `200` `{ success: true, message, data: { resetToken: rawToken, expiresAt: expiresAt.toISOString() } }`.
    6. Else (production): return `200` `{ success: true, message, data: null }`.
  - **`resetPassword`**:
    1. Read `token = req.body.token` and `password = req.body.password`. Compute `tokenHash = hashResetToken(token)`.
    2. Inside `prisma.$transaction`:
       - Look up `record = await tx.passwordResetToken.findUnique({ where: { tokenHash } })`.
       - Check `record && record.usedAt === null && record.expiresAt > new Date()`. If not, return `400` `{ success: false, message: 'Invalid or expired password reset token.' }`.
       - Atomically claim token to prevent concurrent replay:
         `const claimed = await tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });`
         If `claimed.count !== 1`, return `400` `{ success: false, message: 'Invalid or expired password reset token.' }`.
       - Hash `hashedPassword = await hash(password, 10)` (matching `register` at `auth.controller.ts:27`).
       - Update `tx.user.update({ where: { id: record.userId }, data: { hashedPassword } })`.
       - Invalidate any other unused tokens for `record.userId`.
    3. Return `200` `{ success: true, message: 'Password has been reset successfully. You can now sign in.', data: null }`.

### 3.4 Frontend Integration (`frontend/src/`)
1. **`frontend/src/services/api.ts`**:
   - Add `ForgotPasswordResult { resetToken?: string; expiresAt?: string }` and `requestPasswordReset(email: string)` (`POST /auth/forgot-password`) + `resetPassword(payload: { token: string; password: string })` (`POST /auth/reset-password`).
2. **`frontend/src/components/auth/Login.tsx`**:
   - Add `<Link to="/forgot-password" id="forgot-password-link">` on the Password label row (`lines 208-214`).
   - Optionally read `?reset=success` via `useSearchParams()` to display a subtle emerald confirmation banner above the form when redirected after a successful reset.
3. **New Pages (`frontend/src/components/auth/ForgotPassword.tsx`, `ResetPassword.tsx`)**:
   - Styled consistently with the current design system (or the updated `DESIGN.md` Bento aesthetic being built alongside this task), redirecting to `/` if `useAuthStore.token` is set.
   - `ForgotPassword.tsx`: Email form -> calls `requestPasswordReset(email)` -> shows uniform confirmation state; if `result?.resetToken` is returned (dev/demo/test), renders a clear "Local Dev / Demo Reset Link" callout with a primary button navigating to `/reset-password?token=${encodeURIComponent(result.resetToken)}` plus a secondary link to `/reset-password` for manual token entry.
   - `ResetPassword.tsx`: Reads `token` from `useSearchParams().get('token') ?? ''` (pre-filled if present, editable input otherwise so manual paste works), `password` (min 6 chars), `confirmPassword` (must match). Calls `resetPassword({ token, password })` -> on success, shows confirmation and redirects/links to `/login?reset=success`.
4. **`frontend/src/App.tsx`**:
   - Add public routes before the `ProtectedRoute` group:
     - `<Route path="/forgot-password" element={<ForgotPassword />} />`
     - `<Route path="/reset-password" element={<ResetPassword />} />`

### 3.5 E2E Tests (`backend/tests/e2e.test.ts`)
- Update `cleanupTestUsers()` (`lines 70-87`) to also run `await prisma.passwordResetToken.deleteMany({ where: { userId: { in: ids } } });` before `prisma.user.deleteMany`.
- Add test coverage across Tiers 1–3:
  - **Tier 1 (Happy Path)**:
    - `POST /api/auth/forgot-password` for registered user returns `200` with `data.resetToken` (since `NODE_ENV === 'test'`) and `expiresAt`; token stored in DB is SHA-256 hashed (`tokenHash !== resetToken`).
    - `POST /api/auth/reset-password` with valid token + new password returns `200`; old password returns `401` on `/api/auth/login`; new password returns `200` with `{ token, id, email }`.
    - Case-insensitive email lookup on `forgot-password` succeeds.
  - **Tier 2 (Validation, Security & Boundaries)**:
    - Unregistered email on `forgot-password` still returns `200` (anti-enumeration) and does not leak a `resetToken`.
    - Malformed email on `forgot-password` returns `400`.
    - Missing/empty token or short password (`<6` chars) on `reset-password` returns `400`.
    - Unknown/random token on `reset-password` returns `400`.
    - Expired token (`expiresAt` in past) returns `400`.
    - Single-use enforcement: reusing an already-consumed token returns `400`.
    - Superseding enforcement: requesting a second `forgot-password` invalidates the first token (`400` when using first token, `200` when using second).
  - **Tier 3 (Cross-Feature / Multi-Tenancy)**:
    - Resetting User A's password preserves User A's `Cycle`, `DailyLog`, and `PlannedAction` records and cannot mutate User B's account.

---

## 4. Caveats

1. **Existing 7-day JWTs remain valid post-reset:** `authMiddleware.ts:24` only verifies JWT signature/expiry (`{ id: user.id }`) without checking a `tokenVersion` or `passwordUpdatedAt` column. If immediate revocation of active sessions upon password reset is desired, add `tokenVersion Int @default(0)` to `User`, embed `tv` in `sign(...)` (`auth.controller.ts:29,73`), increment `tokenVersion` on `resetPassword`, and verify `payload.tv === user.tokenVersion` in `authMiddleware.ts`. (Left optional to avoid unnecessary DB queries on every protected request unless required.)
2. **Email case sensitivity in `login` / `register`:** `auth.controller.ts:19,57` queries `email` case-sensitively (`where: { email }`), and `e2e.test.ts:147,178` expects `register` to echo the trimmed email. Using `mode: 'insensitive'` in `forgotPassword` will find the user regardless of capitalization, while keeping `register`/`login` behavior backwards-compatible with existing tests.
3. **No rate limiting middleware installed:** `backend/package.json` has no `express-rate-limit`. In production deployments, `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` should be rate-limited at the reverse proxy or via `express-rate-limit` to prevent token-request flooding.
4. **In-dev token exposure vs. anti-enumeration:** Returning `data.resetToken` when `user` exists in `NODE_ENV !== 'production'` intentionally distinguishes registered vs. unregistered emails in dev/test to enable SMTP-free usability and automated testing. In `NODE_ENV === 'production'` (without `EXPOSE_RESET_TOKEN=true`), both cases return identical `200` `{ success: true, message, data: null }`.
5. **No live commands or DB mutations executed:** Per read-only explorer rules, no schema migration or build/test execution was run.

---

## 5. Conclusion

The codebase on commit `bb6ddeb` is cleanly structured for adding Forgot Password via:
1. A `PasswordResetToken` Prisma model + SQL migration (compatible with `entrypoint.js`'s `prisma migrate deploy`).
2. `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` in `auth.routes.ts` / `auth.controller.ts` with `forgotPasswordSchema` / `resetPasswordSchema` in `validate.ts`, SHA-256 hashed 256-bit tokens, 15-minute expiration, atomic single-use claiming, `bcrypt` hashing, and environment-gated token preview (`NODE_ENV !== 'production' || EXPOSE_RESET_TOKEN === 'true'`).
3. Typed helpers in `frontend/src/services/api.ts`, public `/forgot-password` & `/reset-password` routes in `App.tsx`, and a `"Forgot password?"` link on `Login.tsx`.
4. Comprehensive Tier 1–3 tests in `backend/tests/e2e.test.ts` plus `passwordResetToken` cleanup in `cleanupTestUsers()`.

---

## 6. Verification Method

Once implemented, an implementer/verifier can independently verify with:
1. **Prisma & Migration Check (in `backend/`):**
   - `npx prisma validate`
   - `npx prisma migrate deploy` (against local PostgreSQL 15 per `TEST_INFRA.md`)
   - `npx prisma generate`
2. **Backend Typecheck, Build & E2E Suite (in `backend/`):**
   - `npm run typecheck && npm run build`
   - `npm test` (verifies all existing 40 tests + new Forgot/Reset Password Tier 1–3 tests pass).
3. **Frontend Typecheck, Lint & Build (in `frontend/`):**
   - `npm run lint && npm run build`
4. **Invalidation Conditions:**
   - Any migration failure under `prisma migrate deploy` (breaks `backend/scripts/entrypoint.js`).
   - Any `401` returned by `/api/auth/reset-password` (would trigger `useAuthStore.logout()` in `frontend/src/api/client.ts:31-33`).
   - Token returned in HTTP response when `NODE_ENV=production` and `EXPOSE_RESET_TOKEN` is unset.
