# M2 Briefing — Forgot Password Backend, Prisma Migration & E2E Tests (`FEAT-04`)

- **Milestone**: M2 (`FEAT-04`)
- **Parent Orchestrator**: `7a94579ae402af0f7649534b2a87bc3b`
- **Repository**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker`
- **Base Commit**: `bb6ddeb`
- **Design & Spec References**:
  - `ORIGINAL_REQUEST.md`
  - `PROJECT.md § Interface Contracts (1b)` & `§ Code Layout`
  - `TEST_INFRA.md`
  - `explorer_auth_2/handoff.md`
  - `explorer_env_3/handoff.md`

## Core Objective
Implement genuine, production-safe Forgot Password & Reset Password backend endpoints (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`) backed by a `PasswordResetToken` Prisma model & committed SQL migration, Zod validation, atomic single-use SHA-256 token claim, production anti-enumeration (`NODE_ENV !== 'production' || EXPOSE_RESET_TOKEN === 'true'`), `400` status hygiene (never `401`), and comprehensive Tier 1–4 E2E tests in `backend/tests/e2e.test.ts`.
