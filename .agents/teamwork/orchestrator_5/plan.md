# Execution Plan — orchestrator_5

## Baseline (Commit `bb6ddeb`)
- `M1` is complete and clean (`40/40` E2E tests in `backend/tests/e2e.test.ts`, backend `typecheck`/`build` pass, frontend `lint`/`build` pass).
- PostgreSQL 15 cluster at `/home/antigravity/.local/share/pg15/data` is currently stopped (stale `postmaster.pid`) and must be started before Prisma migrations and E2E tests.

## Milestones & Parallelism
1. **Milestone `M2` (Parallel Track A — Backend Forgot Password & E2E Tests)**:
   - Delegated to `sub_orch_m2` (state folder: `.agents/teamwork/sub_orch_m2`).
   - Implements `PasswordResetToken` Prisma model + committed SQL migration, `forgotPasswordSchema` & `resetPasswordSchema` in `validate.ts`, `POST /api/auth/forgot-password` & `POST /api/auth/reset-password` in `auth.controller.ts` & `auth.routes.ts`, and Tier 1–4 E2E tests + `cleanupTestUsers()` update in `backend/tests/e2e.test.ts`.
   - Verified via `sub_orch_m2`'s Explorer → Worker → 2 Reviewers + 2 Challengers + 1 Forensic Auditor gate.
2. **Milestone `M3` (Parallel Track B — `DESIGN.md` Overhaul, Dual-Mode Foundation, Primitives, `HardwareViz`, Chrome, Auth/Forgot-Password & Launchpad)**:
   - Delegated to `sub_orch_m3` (state folder: `.agents/teamwork/sub_orch_m3`).
   - Updates `DESIGN.md`; implements `themeStore.ts`, Light/Warm + Dark CSS variables in `index.html` & `index.css`; rebuilds `ui/*` (zero shadows, `24px–32px` Bento radii, `rounded-full` pills), creates `HardwareViz.tsx` (`SegmentedBattery`, `CapsuleBarChart`, `ConcentricRing`, `DotMatrixRibbon`, `PillarCompassDiagram`); rebuilds `AppLayout.tsx`, `Login.tsx` (with `"Forgot password?"`), `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `StartSprintScreen.tsx`, `services/api.ts`, and `App.tsx`.
   - Verified via `sub_orch_m3`'s Explorer → Worker → 2 Reviewers + 2 Challengers + 1 Forensic Auditor gate.
3. **Milestone `M4` (Final Milestone — Command Center, Hardware Analytics Rebuild & Whole-Project Verification)**:
   - Runs strictly AFTER `M2` and `M3` pass!
   - Delegated to `sub_orch_m4` (state folder: `.agents/teamwork/sub_orch_m4`).
   - Rebuilds `Tracker.tsx`, `HabitGrid.tsx`, `HabitCard.tsx`, `PlanningModal.tsx`, and `AnalyticsDashboard.tsx` (replacing Recharts with bespoke `HardwareViz` hardware-style visualizations, asymmetrical Bento layout, `36px–48px` editorial typography with inline icon badges, zero drop shadows, dual Light/Warm & Dark mode parity), updates `TEST_READY.md`, and runs **whole-project verification** (`backend` typecheck/build/E2E suite, `frontend` lint/build, live UI/API integration checks, and **whole-project Forensic Audit** with no sub-scope path restriction).
4. **Final Signoff**:
   - Update `PROJECT.md` milestone statuses to `DONE` and message `sentinel_5` (`f749ee6d253c2aaddcaae49c6f81b15d`) to trigger the mandatory Victory Audit.
