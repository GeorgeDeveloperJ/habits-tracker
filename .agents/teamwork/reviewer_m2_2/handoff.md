# Review Report — `reviewer_m2_2` (Secondary Reviewer, Milestone M2: `FEAT-04`)

## Verdict: **APPROVE**

All M2 (`FEAT-04`) deliverables in `backend/` strictly conform to `PROJECT.md § 1b`, `.agents/teamwork/sub_orch_m2/SCOPE.md`, and `TEST_INFRA.md`. Security boundaries, database schema & migration, input validation, HTTP status hygiene, and E2E test assertions were independently verified by direct file/diff inspection and independent command execution (without running `npm test`, avoiding concurrent DB race with `reviewer_m2_1`).

---

## 1. Scope & Working-Tree Hygiene

`git status --short -- backend/` confirms modifications are strictly confined to M2's exclusive owned paths:
- `M backend/prisma/schema.prisma`
- `M backend/src/controllers/auth.controller.ts`
- `M backend/src/middlewares/validate.ts`
- `M backend/src/routes/auth.routes.ts`
- `M backend/tests/e2e.test.ts`
- `?? backend/prisma/migrations/20261118140207_add_password_reset_tokens/`

Zero forbidden paths (`DESIGN.md`, `frontend/**`, `PROJECT.md`, `ORIGINAL_REQUEST.md`, `TEST_INFRA.md`, `TEST_READY.md`) were touched by M2.

---

## 2. Independent Verification Commands & Exact Outputs

Executed from `/home/antigravity/GeorgeDeveloperJ/habits-tracker/backend`:

### 2.1 Prisma Schema Validation
Command:
```bash
npx --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend prisma validate
```
Exit Code: `0`
Exact Output:
```text
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Loaded Prisma config from prisma.config.ts.

warn The Prisma config file in prisma.config.ts overrides the deprecated `package.json#prisma` property in package.json.
  For more information, see: https://pris.ly/prisma-config

Prisma config detected, skipping environment variable loading.
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid 🚀
```

### 2.2 Backend Typecheck
Command:
```bash
npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend run typecheck
```
Exit Code: `0`
Exact Output:
```text
> habit-trackers-backend@1.0.0 typecheck
> tsc --noEmit
```

### 2.3 Strict TypeScript Check on `backend/tests/e2e.test.ts`
Command:
```bash
npx tsc --ignoreConfig --noEmit --strict --target ES2022 --module commonjs --moduleResolution node --ignoreDeprecations 6.0 --esModuleInterop --skipLibCheck --types node tests/e2e.test.ts
```
Exit Code: `0` (no output / 0 errors)

---

## 3. Deep Code, Security & Design Review Evidence

### 3.1 Prisma Schema & Migration
- **`backend/prisma/schema.prisma:88`**: Adds `passwordResetTokens PasswordResetToken[]` on `User`.
- **`backend/prisma/schema.prisma:95-106`**: Defines `PasswordResetToken` with `id` (`@id @default(uuid())`), `tokenHash` (`@unique`), `userId` with `onDelete: Cascade`, `expiresAt`, `usedAt` (`DateTime?`), `createdAt` (`@default(now())`), `@@index([userId])`, and `@@index([expiresAt])`.
- **`backend/prisma/migrations/20261118140207_add_password_reset_tokens/migration.sql:1-24`**: Creates `"PasswordResetToken"` table, unique index `"PasswordResetToken_tokenHash_key"`, secondary indexes `"PasswordResetToken_userId_idx"` and `"PasswordResetToken_expiresAt_idx"`, and foreign key `"PasswordResetToken_userId_fkey"` (`ON DELETE CASCADE ON UPDATE CASCADE`). Matches `schema.prisma` 1:1.

### 3.2 Public Route Mounting (No `authMiddleware`)
- **`backend/src/index.ts:23`**: Mounts `app.use('/api/auth', authRoutes)` without `authMiddleware`.
- **`backend/src/routes/auth.routes.ts:19-21`**: Registers `POST /forgot-password` (`validate(forgotPasswordSchema), forgotPassword`) and `POST /reset-password` (`validate(resetPasswordSchema), resetPassword`) with NO `authMiddleware`.

### 3.3 Zod Validation & Edge Cases
- **`backend/src/middlewares/validate.ts:4-18`**: `validate` parses `req.body ?? {}`, returns `400` `{ success: false, message, errors }` on invalid payloads, and replaces `req.body = result.data` so trimmed values flow to controllers.
- **`backend/src/middlewares/validate.ts:42-48`**: `forgotPasswordSchema` enforces `z.string().trim().min(1).email()` (rejects missing/non-string/whitespace-only/malformed emails with `400`, trims valid padded emails).
- **`backend/src/middlewares/validate.ts:50-58`**: `resetPasswordSchema` enforces `token: z.string().trim().min(1)` and `password: z.string().min(6)` (rejects missing/whitespace-only token and short passwords with `400`, preserves intentional spaces in password).

### 3.4 Cryptographic, Transactional & Status-Code Hygiene (`auth.controller.ts`)
- **SHA-256 Hashing (`backend/src/controllers/auth.controller.ts:8-10`)**: `hashResetToken` computes `crypto.createHash('sha256').update(token).digest('hex')`; raw reset tokens are never persisted in DB.
- **CSPRNG Entropy & Prior-Token Invalidation (`backend/src/controllers/auth.controller.ts:118-136`)**: Generates 256-bit `crypto.randomBytes(32).toString('hex')` with `Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 15` minutes TTL. Inside `prisma.$transaction`, marks any prior unused tokens (`usedAt: null`) as used before creating the new `PasswordResetToken`.
- **Case-Insensitive Lookup & Anti-Enumeration Gating (`backend/src/controllers/auth.controller.ts:105-157`)**:
  - Lookup uses `{ email: { equals: email, mode: 'insensitive' } }` (line 107).
  - Unregistered emails return `200` `{ success: true, message, data: null }` (lines 110-116).
  - Token exposure (`data: { resetToken, expiresAt }`) and `logger.info` logging are gated strictly on `process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_TOKEN === 'true'` (lines 138-151); otherwise returns `200` `{ success: true, message, data: null }` (lines 153-157).
- **Atomic Single-Use Claim, Cost-10 Bcrypt & `400` Status Hygiene (`backend/src/controllers/auth.controller.ts:167-235`)**:
  - Inside `prisma.$transaction`, looks up `tokenHash` (lines 182-184), checks `record && record.usedAt === null && record.expiresAt > now` (line 186), and atomically claims via `tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } })` verifying `claimed.count === 1` (lines 190-201).
  - Hashes new password with `bcrypt` cost `10` (`hash(password, 10)`, line 203), updates `User.hashedPassword` (lines 204-207), and invalidates any remaining unused tokens for `record.userId` (lines 209-212).
  - Invalid/expired/used/race-lost tokens return `400` `{ success: false, message: 'Invalid or expired password reset token.' }` (lines 217-222) — **NEVER `401`**, preventing frontend Axios interceptors from triggering unintended logout.
  - Success returns `200` `{ success: true, message: 'Password has been reset successfully. You can now sign in.', data: null }` (lines 224-228).

### 3.5 E2E Test Quality (`backend/tests/e2e.test.ts`)
- **`cleanupTestUsers()` (`backend/tests/e2e.test.ts:71-89`)**: Deletes `prisma.passwordResetToken` rows by `userId` at line 84 before deleting `plannedAction`, `dailyLog`, `cycle`, and `user` rows, avoiding FK violations.
- **Tier 1 (`T1-AUTH-PW-01..05`, lines 203-345)**: Exercises real HTTP endpoints and Prisma DB state (SHA-256 storage check, whitespace trimming & uppercase email match, `usedAt` DB persistence, new password login & old password `401`, prior-token invalidation).
- **Tier 2 (`T2-AUTH-PW-01..05`, lines 637-795)**: Exercises malformed/empty email `400`, anti-enumeration `200 data: null` for unregistered email and `NODE_ENV=production`, missing token/short password/unknown token `400`, expired token `400`, and concurrent `Promise.all` replay `[200, 400]` + sequential reuse `400` + old password `401`.
- **Tier 3 (`T3-PAIR-05`, lines 1148-1196)** & **Tier 4 (`T4-SCEN-07`, lines 1562-1646)**: Exercises multi-tenant isolation, sprint data retention after reset, and end-to-end locked-out user recovery through sprint goal completion.
