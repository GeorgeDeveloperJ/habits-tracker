## 2026-11-18T04:36:28Z

You are `spec_miner_survey_3` (`teamwork_preview_spec_miner`), dispatched by the Project Orchestrator (`5e929c32a75872b1b18af69eec215582`) for Step 0 Survey (Specifications, Contracts & Feature Inventory).

- **Working directory**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker`
- **Your state folder**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/spec_miner_survey_3`
- **Original user request**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md` (MUST read first!)
- **Full MVP Roadmap**: `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/ef9ddef1-2ead-4945-9d35-08c3f70bc8a2/roadmap.md` (MUST read!)
- **Parent Conversation ID**: `5e929c32a75872b1b18af69eec215582`

### Objective
Probe all authoritative sources (`ORIGINAL_REQUEST.md`, `roadmap.md`, `README.md`, `docs/`, git commit history, GitHub issues/PRs if accessible or referenced, Prisma schema, existing API routes & frontend service calls) to produce an exhaustive specification and Feature Inventory for the Proactive 31-Day Habit Tracker MVP:
1. Read `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`, `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/ef9ddef1-2ead-4945-9d35-08c3f70bc8a2/roadmap.md`, and `/home/antigravity/GeorgeDeveloperJ/habits-tracker/README.md`.
2. Enumerate every feature across Phases 1–4 (`FIX-01`..`FIX-04`, `FEAT-01`..`FEAT-03`, `UI-01`, `QUAL-01`) with a unique feature ID, clear description, requirements, acceptance criteria, and edge/error cases.
3. Specify exact API contracts between `backend` and `frontend` (`api.ts`):
   - `POST /api/auth/register` and `POST /api/auth/login` (request validation, response `{ token, id, email }` or `{ success, data: { token, id, email } }` — verify what `Login.tsx`, `Register.tsx`, `useAuthStore.ts`, and `api.ts` expect so backend and frontend match 100%!).
   - `GET /api/habits` (8 Core Pillars: Learning, Physical Health, Nutrition, Mindfulness, Work / Focus, Finance, Organization, Rest — envelope `{ success: true, data: [...] }`).
   - `POST /api/cycles/start` & `GET /api/cycles/current` (scoping by `userId`, deactivating prior active cycles, handling Day 1 / Day 31 rollover).
   - `GET /api/cycle-progress/:cycleId` (scoping by `userId`, respecting `:cycleId` or active cycle, returning progress stats + per-pillar completion rates & daily completion series for Analytics).
   - `POST /api/days`, `GET /api/days`, `PATCH /api/days/:id` (scoping by `userId`, idempotency per calendar day/targetDate `'today' | 'tomorrow'`, Close Day validation that tomorrow's pillars are planned before setting `isClosed = true`).
   - `POST /api/actions`, `PATCH /api/actions/:id`, `DELETE /api/actions/:id` (scoping by `userId`, target `logId` or `targetDate: 'today' | 'tomorrow'`, updating `description` and/or `isCompleted`, rejecting edits/toggles/deletes when parent `dailyLog.isClosed === true` or owned by another user).
4. Document the E2E testability requirements and how each feature can be verified both at the API level and UI/build level.

### Output Requirements
- Maintain `BRIEFING.md` and `progress.md` in `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/spec_miner_survey_3`.
- Write your comprehensive specification report to `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/spec_miner_survey_3/handoff.md`.
- Do NOT modify any project files outside your state folder.
- Send a concise completion message via `send_message` to `5e929c32a75872b1b18af69eec215582` referencing `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/spec_miner_survey_3/handoff.md`.
