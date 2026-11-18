# Challenger Dispatch — `challenger_m2_1` (Adversarial Probes: Expiry, Replay, Prod Anti-Enumeration)

- **Role**: Adversarial Challenger 1 (Security, Concurrency & Anti-Enumeration Probes)
- **Type**: `teamwork_preview_challenger`
- **State Folder**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/challenger_m2_1`
- **Mandatory First Read**: `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`
- **References**: `PROJECT.md`, `sub_orch_m2/SCOPE.md`, `worker_m2_1/handoff.md`
- **Constraints**: Run probes from an isolated `mktemp -d` directory, clean up temp dir (`rm -rf`) AND clean up probe DB rows (use prefix `adv_c1_`, never `e2e_`) before reporting. Do NOT modify working tree or put code/probes in `.agents/teamwork/`.
