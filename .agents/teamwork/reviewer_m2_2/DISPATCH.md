# Reviewer Dispatch — `reviewer_m2_2` (Secondary Reviewer, `M2: FEAT-04`)

- **Role**: Secondary Reviewer (Code, Security, Contract & Typecheck Review — No Concurrent DB/E2E)
- **Type**: `teamwork_preview_reviewer`
- **State Folder**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/reviewer_m2_2`
- **Mandatory First Read**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`
- **References**: `PROJECT.md`, `TEST_INFRA.md`, `sub_orch_m2/SCOPE.md`, `worker_m2_1/handoff.md`
- **Constraints**: Do NOT modify working tree files or put code/probes in `.agents/teamwork/`. Do NOT run `npm test` (avoid DB collision with `reviewer_m2_1`). Run `typecheck` & `prisma validate` independently.
