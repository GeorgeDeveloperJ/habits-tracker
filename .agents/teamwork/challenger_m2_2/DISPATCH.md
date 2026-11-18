# Challenger Dispatch — `challenger_m2_2` (Adversarial Probes: Status Hygiene, Email Case/Input, Migration Idempotency)

- **Role**: Adversarial Challenger 2 (Status Hygiene, Input Boundaries & Migration Idempotency)
- **Type**: `teamwork_preview_challenger`
- **State Folder**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/challenger_m2_2`
- **Mandatory First Read**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`
- **References**: `PROJECT.md`, `sub_orch_m2/SCOPE.md`, `worker_m2_1/handoff.md`
- **Constraints**: Run probes from an isolated `mktemp -d` directory, clean up temp dir (`rm -rf`) AND clean up probe DB rows/temp DB before reporting. Use prefix `adv_c2_` (never `e2e_`). Do NOT modify working tree or put code/probes in `.agents/teamwork/`.
