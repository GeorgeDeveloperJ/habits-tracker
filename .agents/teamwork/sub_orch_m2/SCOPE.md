# M2 Scope & Exclusive File Ownership (`FEAT-04`)

## Exclusive Owned Paths (M2 ONLY)
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/<timestamp>_add_password_reset_tokens/migration.sql`
- `backend/src/middlewares/validate.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/auth.routes.ts`
- `backend/tests/e2e.test.ts`

## Strictly Forbidden Paths (Owned by M3 in parallel / Read-only)
- `DESIGN.md`
- `frontend/**`
- `PROJECT.md`
- `ORIGINAL_REQUEST.md`
- `TEST_INFRA.md`
- `TEST_READY.md`

## Contract Requirements (`PROJECT.md § 1b`)
1. `PasswordResetToken` model in `schema.prisma`:
   - `id String @id @default(uuid())`
   - `tokenHash String @unique`
   - `userId String` + `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
   - `expiresAt DateTime`
   - `usedAt DateTime?`
   - `createdAt DateTime @default(now())`
   - `@@index([userId])`, `@@index([expiresAt])`
   - Relation `passwordResetTokens PasswordResetToken[]` on `User`
   - Committed SQL migration via `npx prisma migrate dev --name add_password_reset_tokens` + `npx prisma generate`.
2. Zod Schemas in `backend/src/middlewares/validate.ts`:
   - `forgotPasswordSchema`: `{ email: trimmed, non-empty, valid email }`
   - `resetPasswordSchema`: `{ token: trimmed, non-empty string; password: min 6 chars }`
3. Public Routes in `backend/src/routes/auth.routes.ts` (NO `authMiddleware`):
   - `POST /forgot-password` -> `validate(forgotPasswordSchema), forgotPassword`
   - `POST /reset-password` -> `validate(resetPasswordSchema), resetPassword`
4. Controller Logic in `backend/src/controllers/auth.controller.ts`:
   - `forgotPassword`:
     - Case-insensitive lookup: `prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })`
     - Uniform message: `'If an account with that email exists, password reset instructions have been generated.'`
     - If `!user`: return `200` `{ success: true, message, data: null }`
     - If `user`: in `prisma.$transaction`, invalidate prior unused tokens (`updateMany` `usedAt: null -> new Date()`), generate `crypto.randomBytes(32).toString('hex')` (256-bit CSPRNG), store SHA-256 `tokenHash`, `expiresAt` (`Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 15` minutes).
     - If `process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_TOKEN === 'true'`: log reset link via `logger.info` and return `200` `{ success: true, message, data: { resetToken: rawToken, expiresAt: expiresAt.toISOString() } }`.
     - Else: return `200` `{ success: true, message, data: null }`.
   - `resetPassword`:
     - Hash incoming trimmed `token` with SHA-256 (`tokenHash`).
     - Inside `prisma.$transaction`: look up `findUnique({ where: { tokenHash } })`; verify `record && record.usedAt === null && record.expiresAt > new Date()`; atomically claim via `updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } })`; check `claimed.count === 1`; hash password with `bcrypt` (`hash(password, 10)`); update `user.hashedPassword`; invalidate any other unused tokens for `record.userId`.
     - Return `200` `{ success: true, message: 'Password has been reset successfully. You can now sign in.', data: null }`, or `400` `{ success: false, message: 'Invalid or expired password reset token.' }` on invalid/expired/reused/race-lost token (NEVER `401`).
5. E2E Suite (`backend/tests/e2e.test.ts`):
   - Update `cleanupTestUsers()` to delete `passwordResetToken` rows before `user` rows.
   - Add >= 5 Tier 1 tests (`T1-AUTH-PW-01..05`).
   - Add >= 5 Tier 2 tests (`T2-AUTH-PW-01..05`).
   - Add Tier 3 `T3-PAIR-05` (Password Reset x Multi-Tenancy & Data Retention).
   - Add Tier 4 `T4-SCEN-07` (Locked-Out User Password Recovery & Sprint Continuation).
   - Preserve all 40 existing tests passing (52+ total tests).
