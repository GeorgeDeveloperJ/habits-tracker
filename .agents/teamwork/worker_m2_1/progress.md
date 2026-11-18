# Worker M2_1 Progress (`FEAT-04`)

## Plan
1. [x] Start PostgreSQL 15 and verify 8 Core Pillars seed.
2. [x] Update `backend/prisma/schema.prisma` with `PasswordResetToken` and `User.passwordResetTokens`.
3. [x] Run `npx prisma migrate dev --name add_password_reset_tokens` and `npx prisma generate`.
4. [x] Add `forgotPasswordSchema` and `resetPasswordSchema` to `backend/src/middlewares/validate.ts`.
5. [x] Implement `forgotPassword` and `resetPassword` in `backend/src/controllers/auth.controller.ts` and register routes in `backend/src/routes/auth.routes.ts`.
6. [x] Update `backend/tests/e2e.test.ts` with `passwordResetToken` cleanup + Tier 1 (`T1-AUTH-PW-01..05`), Tier 2 (`T2-AUTH-PW-01..05`), Tier 3 (`T3-PAIR-05`), and Tier 4 (`T4-SCEN-07`).
7. [x] Run full verification (`prisma validate`, strict `tsc` check on `e2e.test.ts`, `typecheck`, `build`, `npm test`) and write `handoff.md`.
