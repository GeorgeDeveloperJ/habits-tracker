# E2E Test Infra: Proactive 31-Day Habit Tracker

## Test Philosophy
- Opaque-box, requirement-driven verification supplemented by real multi-tenant HTTP API integration tests and full frontend TypeScript/Vite build & component verification.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing across 4 Tiers (plus Tier 5 Adversarial Hardening).

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | `FIX-01`: Branch Consolidation, Docker Config & Dual DB Adapter | `ORIGINAL_REQUEST.md` §Phase 1.1 | 5 | 5 | ✓ |
| 2 | `FIX-02a`: User-Scoped Cycle Management (`startCycle`, `getCurrentCycle`, `history`) | `ORIGINAL_REQUEST.md` §Phase 1.2 | 5 | 5 | ✓ |
| 3 | `FIX-02b`: User-Scoped & Parameter-Aware Cycle Progress | `ORIGINAL_REQUEST.md` §Phase 1.2 | 5 | 5 | ✓ |
| 4 | `FIX-02c`: User-Scoped & Idempotent Daily Logs (`POST/GET/PATCH /api/days`) | `ORIGINAL_REQUEST.md` §Phase 1.2 | 5 | 5 | ✓ |
| 5 | `FIX-02d`: User-Scoped Planned Actions (`POST/PATCH/DELETE /api/actions`) | `ORIGINAL_REQUEST.md` §Phase 1.2 | 5 | 5 | ✓ |
| 6 | `FIX-03a`: Unified Auth Payload (`{ token, id, email }` on Register & Login) | `ORIGINAL_REQUEST.md` §Phase 1.3 | 5 | 5 | ✓ |
| 7 | `FIX-03b`: Reactive `HabitContext` Bound to `useAuthStore.token` | `ORIGINAL_REQUEST.md` §Phase 1.3 | 5 | 5 | ✓ |
| 8 | `FIX-04`: Standardized JSON Envelopes & Dead Code Removal | `ORIGINAL_REQUEST.md` §Phase 1.4 | 5 | 5 | ✓ |
| 9 | `FEAT-01`: Edit & Delete Daily Goals + Closed-Day Immutability (Issue #6) | `ORIGINAL_REQUEST.md` §Phase 2.1 | 5 | 5 | ✓ |
| 10 | `FEAT-02a`: Today's Execution vs. Tomorrow's Proactive Plan + Day 1 Onboarding | `ORIGINAL_REQUEST.md` §Phase 2.2 | 5 | 5 | ✓ |
| 11 | `FEAT-02b`: "Close Day" Gatekeeper (`PATCH /api/days/:id`) | `ORIGINAL_REQUEST.md` §Phase 2.3 | 5 | 5 | ✓ |
| 12 | `UI-01`: `DESIGN.md` & 4-Screen Stitch-Guided Dark UI Redesign (Issue #11) | `ORIGINAL_REQUEST.md` §Phase 3 | 5 | 5 | ✓ |
| 13 | `FEAT-03`: Live Analytics Dashboard, Sprint History Day Inspector & Day 31 Rollover | `ORIGINAL_REQUEST.md` §Phase 4.1–4.2 | 5 | 5 | ✓ |
| 14 | `QUAL-01`: Zod Request Validation Middleware & Multi-Tenant Security | `ORIGINAL_REQUEST.md` §Phase 4.3 | 5 | 5 | ✓ |
| 15 | `FEAT-04`: Forgot Password & Reset Password API + Security Boundaries | `ORIGINAL_REQUEST.md` §Follow-up `2026-11-18T13:52:21Z` | 5 | 5 | ✓ |
| 16 | `UI-02`: Dual-Mode Modular Bento & Hardware Telemetry UI + Forgot Password UI | `ORIGINAL_REQUEST.md` §Follow-up `2026-11-18T13:52:21Z` | ✓ | ✓ | ✓ |

## Test Architecture
- **Test Runner**:
  - Backend E2E & Integration Suite: `npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend test` (executes `backend/tests/e2e.test.ts` via `node --import tsx --test` against a real PostgreSQL 15 instance + Prisma schema & seeded 8 Core Pillars).
  - Backend Build & Typecheck: `npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend run typecheck && npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend run build`.
  - Frontend Build, Typecheck & Lint: `npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run lint && npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run build`.
- **Database Environment in VM**:
  - Uses local user-space PostgreSQL 15 binaries (`/usr/lib/postgresql/15/bin/{initdb,pg_ctl,postgres}`) running on port `5432` with data directory in `/home/antigravity/.gemini/jetski/scratch/teamwork_tmp/` and `DATABASE_URL="postgresql://postgres@127.0.0.1:5432/habits_tracker_db?schema=public"`.
- **Directory Layout**:
  - `backend/tests/e2e.test.ts` — Full 4-tier automated E2E/integration test suite.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | **New User Onboarding & Day 1 Kickoff**: User registers (`POST /api/auth/register`), receives JWT `{ token, id, email }`, launches a 31-day sprint with Day 1 goals across all 8 pillars, checks off 6 of 8 goals, edits 1 goal description, and verifies `GET /api/cycle-progress/current` reports `75%` completion. | F1, F2, F3, F4, F5, F6, F8, F9, F10 | High |
| 2 | **Proactive Evening Loop & Close Day Gatekeeper**: User attempts to close Day 1 (`PATCH /api/days/:id { isClosed: true }`) with only 3/8 tomorrow pillars planned -> rejected with `400`; user plans the remaining 5 pillars for `targetDate: 'tomorrow'` -> `canCloseToday` becomes `true`; user closes Day 1 -> succeeds (`200`), locking Day 1 against any further edits/toggles/deletes (`400`) while Tomorrow's plan remains editable. | F4, F5, F9, F10, F11, F14 | High |
| 3 | **Multi-Tenant Isolation Under Concurrent Users**: User A and User B both register, start cycles, log days, and plan actions concurrently. User B queries `/api/cycles`, `/api/days`, `/api/cycle-progress/current` and attempts to `PATCH`/`DELETE` User A's `DailyLog` and `PlannedAction` IDs -> zero data leakage and all cross-tenant mutations rejected with `404`. | F2, F3, F4, F5, F6, F9, F11, F14 | High |
| 4 | **Multi-Day Sprint Progression, Analytics & History Inspection**: User logs actions across multiple days of a 31-day cycle, queries `/api/cycle-progress/current` and `/api/cycles/history`, and verifies `pillarStats` (8 pillars with accurate rates and streaks), `dailySeries` (chronological day numbers and completion counts), and past day inspection. | F2, F3, F8, F10, F13 | High |
| 5 | **Day 31 Completion & Next Sprint Rollover**: User reaches Day 31 of an active cycle, closes Day 31 without requiring Day 32 planning, views final sprint summary stats, and starts the next 31-day sprint (`POST /api/cycles`) which atomically deactivates the completed cycle (`isActive: false`) and initializes the new cycle. | F2, F3, F4, F11, F13 | High |
| 6 | **Full Frontend + Backend Build & Design System Integrity**: Verify `DESIGN.md`, `ROADMAP.md`, `docker-compose.yml`, and all 4 redesigned screens (`Login`/`Register`, `StartSprintScreen`, `AppLayout` + `HabitGrid`/`Tracker`, `AnalyticsDashboard`) compile cleanly with `tsc -b && vite build` and `eslint` with zero errors. | F1, F7, F8, F12, F13 | High |

## Coverage Thresholds
- Tier 1: ≥5 happy-path tests per feature area
- Tier 2: ≥5 boundary, validation, and negative tests per feature area
- Tier 3: Pairwise coverage of cross-feature interactions (Auth × Multi-Tenancy, Today vs. Tomorrow × Upsert, Close Day × Immutability, Cycle Rollover × Analytics)
- Tier 4: ≥6 realistic end-to-end application scenarios
