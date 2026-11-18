# Milestone M2 Handoff — `sub_orch_m2` (`FEAT-04`: Forgot Password Backend, Prisma Migration & E2E Tests)

**Status:** **DONE / GATE PASSED (Iteration 1)**

All deliverables for Milestone M2 (`FEAT-04`) are implemented strictly within M2's exclusive `backend/` ownership and passed the full 5-verifier Parallel Verification Wave (`auditor_m2_1`: CLEAN; `reviewer_m2_1`: APPROVE; `reviewer_m2_2`: APPROVE; `challenger_m2_1`: PASS 4/4; `challenger_m2_2`: PASS 3/3).

---

## 1. Deliverables (Exclusive M2 Ownership)

1. **`backend/prisma/schema.prisma`**
   - Added `passwordResetTokens PasswordResetToken[]` on `User` and `PasswordResetToken` model (`id`, `tokenHash @unique`, `userId` with `onDelete: Cascade`, `expiresAt`, `usedAt?`, `createdAt`, `@@index([userId])`, `@@index([expiresAt])`).
2. **`backend/prisma/migrations/20261118140207_add_password_reset_tokens/migration.sql`**
   - Committed SQL migration generated via `npx prisma migrate dev --name add_password_reset_tokens`; verified fresh-apply & idempotent `prisma migrate deploy` in an isolated PostgreSQL 15 scratch database (`challenger_m2_2`).
3. **`backend/src/middlewares/validate.ts`**
   - Added `forgotPasswordSchema` (`email` trimmed, non-empty, valid email) and `resetPasswordSchema` (`token` trimmed, non-empty string; `password` min 6 characters).
4. **`backend/src/controllers/auth.controller.ts` & `backend/src/routes/auth.routes.ts`**
   - Registered public routes `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` (no `authMiddleware`).
   - Implemented `PROJECT.md § 1b` contract: case-insensitive email lookup (`mode: 'insensitive'`), 256-bit CSPRNG `crypto.randomBytes(32).toString('hex')`, SHA-256 `tokenHash` storage, 15-minute TTL (`PASSWORD_RESET_TTL_MINUTES || 15`), transactional invalidation of prior unused tokens, atomic single-use claim via `tx.passwordResetToken.updateMany({ where: { id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } })` (`count === 1`), `bcrypt.hash(password, 10)`, uniform `200` anti-enumeration response in production (`NODE_ENV !== 'production' || EXPOSE_RESET_TOKEN === 'true'` token gating), and `400` status hygiene (never `401`).
5. **`backend/tests/e2e.test.ts`**
   - Updated `cleanupTestUsers()` to delete `passwordResetToken` rows before `user` rows.
   - Added 12 real HTTP + PostgreSQL E2E tests (`T1-AUTH-PW-01..05`, `T2-AUTH-PW-01..05`, `T3-PAIR-05`, `T4-SCEN-07`) alongside all 40 existing tests (`52/52` total passing).

---

## 2. Verification & Gate Summary

- **Gate Status**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/sub_orch_m2/GATE_STATUS.md` — **PASS**
- **Verified Commands (Primary Reviewer `reviewer_m2_1` & Auditor `auditor_m2_1`)**:
  - `npx prisma validate` & `npx prisma migrate status`: exit `0` (`Database schema is up to date!`)
  - `npm run typecheck && npm run build` (in `backend/`): exit `0`
  - Strict `tsc --noEmit` on `backend/tests/e2e.test.ts`: exit `0`
  - `npm test` (in `backend/` against PG15 `127.0.0.1:5432`): exit `0` (`52/52` passed across `13` suites, `0` failed, `0` skipped)
- **Subagent Reports**:
  - Worker: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/worker_m2_1/handoff.md`
  - Forensic Auditor (`CLEAN`): `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/auditor_m2_1/handoff.md`
  - Primary Reviewer (`APPROVE`): `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/reviewer_m2_1/handoff.md`
  - Secondary Reviewer (`APPROVE`): `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/reviewer_m2_2/handoff.md`
  - Challenger 1 (`PASS 4/4`): `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/challenger_m2_1/handoff.md`
  - Challenger 2 (`PASS 3/3`): `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/challenger_m2_2/handoff.md`
