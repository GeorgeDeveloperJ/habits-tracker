# Forensic Auditor Dispatch — `auditor_m2_1` (Intermediate Milestone Audit: `M2: FEAT-04`)

- **Role**: Forensic Anti-Cheating Auditor (`M2: FEAT-04`)
- **Type**: `teamwork_preview_auditor`
- **State Folder**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/auditor_m2_1`
- **Mandatory First Read**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`
- **Owned Scope Paths**:
  - `backend/prisma/schema.prisma`
  - `backend/prisma/migrations/20261118140207_add_password_reset_tokens/migration.sql`
  - `backend/src/middlewares/validate.ts`
  - `backend/src/controllers/auth.controller.ts`
  - `backend/src/routes/auth.routes.ts`
  - `backend/tests/e2e.test.ts`
- **Constraints**: Intermediate milestone audit scoped to M2-owned `backend/` paths. Run scoped `typecheck` + `build` + full anti-cheating forensic checks; do NOT run concurrent full E2E suite. Do NOT modify working tree or put code/probes in `.agents/teamwork/`.
