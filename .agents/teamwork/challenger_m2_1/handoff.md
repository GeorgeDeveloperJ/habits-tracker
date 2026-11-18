# Adversarial Challenger Report — `challenger_m2_1` (Milestone M2: `FEAT-04`)

**Overall Verdict:** **PASS** (4/4 adversarial probes passed; zero security, race-condition, status-code, or anti-enumeration regressions observed)

**Target Build Tested:** Compiled backend artifacts under `/home/antigravity/GeorgeDeveloperJ/habits-tracker/backend/dist/` (`index.js`, `controllers/auth.controller.js`, `middlewares/validate.js`, `routes/auth.routes.js`, `config/db.js`) against live PostgreSQL 15 (`127.0.0.1:5432/habits_tracker_db`).

**Isolation & Cleanup:**
- Probe scripts were created exclusively inside an isolated temporary directory created via `mktemp -d /tmp/adv_c1_probe.XXXXXX` (`/tmp/adv_c1_probe.l7ZXQl`).
- Executed via `node /tmp/adv_c1_probe.l7ZXQl/run-probes.js` (exit code `0`).
- All probe DB users used the `adv_c1_*` prefix (`4` created, `4` deleted; `remainingUsers: 0`, `remainingTokens: 0`).
- Temporary directory removed via `rm -rf /tmp/adv_c1_probe.l7ZXQl` and verified absent (`test ! -e /tmp/adv_c1_probe.l7ZXQl`).
- Repository working tree remained untouched (`git status --short` confirmed zero edits outside `.agents/teamwork/challenger_m2_1/{progress.md,handoff.md}`).

---

## Probe Results

### Probe 1: Expired Token Boundary Probe — **PASS**
- **Command Executed:** `node /tmp/adv_c1_probe.l7ZXQl/run-probes.js` (Probe 1 block against ephemeral HTTP server bound to `127.0.0.1:0`)
- **Attack / Boundary Conditions Tested:**
  1. Created user `adv_c1_expired_1795010874391_ehzxn6@example.com`, issued reset token `tok1`, updated `PasswordResetToken.expiresAt` in PostgreSQL to `Date.now() - 1` (1 ms in the past), waited 5 ms, and submitted `POST /api/auth/reset-password`.
  2. Issued reset token `tok2`, updated `PasswordResetToken.expiresAt` in PostgreSQL to `new Date()` (exact boundary), and submitted `POST /api/auth/reset-password`.
  3. Verified DB `usedAt` stayed `null` for rejected expired token `tok2`, and verified `POST /api/auth/login` still succeeded with the original password (`200`) and rejected attempted new password (`401`).
- **Observed HTTP & DB Outputs:**
  - `1ms` past-expiry `POST /api/auth/reset-password`: HTTP **`400`** (NOT `401`)
    ```json
    {
      "success": false,
      "message": "Invalid or expired password reset token."
    }
    ```
  - Exact-boundary `POST /api/auth/reset-password`: HTTP **`400`** (NOT `401`)
    ```json
    {
      "success": false,
      "message": "Invalid or expired password reset token."
    }
    ```
  - `tok2UsedAtAfterBoundaryFail`: `null`
  - `POST /api/auth/login` with original password: HTTP **`200`**
  - `POST /api/auth/login` with attempted reset password: HTTP **`401`**

---

### Probe 2: Concurrent Double-Spend / Replay Race Probe — **PASS**
- **Command Executed:** `node /tmp/adv_c1_probe.l7ZXQl/run-probes.js` (Probe 2 block)
- **Attack / Race Condition Tested:**
  - Created user `adv_c1_race5_1795010874688_flnohs@example.com` and issued a single valid reset token.
  - Fired 5 parallel `Promise.all` `POST /api/auth/reset-password` requests using the **same** token and 5 **distinct** candidate passwords (`RaceWinner_0_Pass!` .. `RaceWinner_4_Pass!`).
- **Observed HTTP & DB Outputs:**
  - Sorted HTTP status codes across all 5 parallel responses: **`[200, 400, 400, 400, 400]`** (exactly 1 `200`, 4 `400`s; zero `500` or `401` responses).
  - Winning request (`idx: 0`) response (HTTP **`200`**):
    ```json
    {
      "success": true,
      "message": "Password has been reset successfully. You can now sign in.",
      "data": null
    }
    ```
  - Losing requests (`idx: 1..4`) response (HTTP **`400`**):
    ```json
    {
      "success": false,
      "message": "Invalid or expired password reset token."
    }
    ```
  - DB `PasswordResetToken.usedAt`: set to `"2026-11-18T14:07:54.773Z"` (non-null).
  - Post-race login matrix: `RaceWinner_0_Pass!` -> HTTP **`200`**; `RaceWinner_1..4_Pass!` -> HTTP **`401`** each; original password -> HTTP **`401`**.

---

### Probe 3: Production Anti-Enumeration Probe (`NODE_ENV=production`) — **PASS**
- **Command Executed:** `node /tmp/adv_c1_probe.l7ZXQl/run-probes.js` spawning isolated child processes running `/tmp/adv_c1_probe.l7ZXQl/prod-child-server.js` with `NODE_ENV=production` on ephemeral port `0` (`127.0.0.1:36219` with `EXPOSE_RESET_TOKEN` unset, and `127.0.0.1:35445` with `EXPOSE_RESET_TOKEN=true`).
- **Attack / Enumeration Conditions Tested:**
  1. Child server 1 (`NODE_ENV=production`, `EXPOSE_RESET_TOKEN` deleted from env, port `36219`): sent `POST /api/auth/forgot-password` for registered `adv_c1_prod_reg_...`, uppercase/whitespace `  ADV_C1_PROD_REG_...  `, and non-existent `adv_c1_prod_missing_...`.
  2. Child server 2 (`NODE_ENV=production`, `EXPOSE_RESET_TOKEN=true`, port `35445`): sent `POST /api/auth/forgot-password` for registered and non-existent emails.
- **Observed HTTP & DB Outputs:**
  - Child 1 (`EXPOSE_RESET_TOKEN` unset):
    - Registered user: HTTP **`200`**
      ```json
      {
        "success": true,
        "message": "If an account with that email exists, password reset instructions have been generated.",
        "data": null
      }
      ```
    - Non-existent user: HTTP **`200`**
      ```json
      {
        "success": true,
        "message": "If an account with that email exists, password reset instructions have been generated.",
        "data": null
      }
      ```
    - Uppercase + whitespace registered user: HTTP **`200`**, byte-for-byte identical JSON (`data: null`, no `resetToken` key leaked).
    - DB verification: `2` `PasswordResetToken` rows stored for registered user (first superseded with non-null `usedAt`, latest active with `usedAt: null` and 64-char hex SHA-256 `tokenHash` `68594cb6c8db46fa...`).
  - Child 2 (`EXPOSE_RESET_TOKEN=true`):
    - Registered user: HTTP **`200`** with `data.resetToken` (64-char hex `0d96b20a62fb6033...` matching DB SHA-256 hash) and `data.expiresAt` (`"2026-11-18T14:22:55.785Z"`).
    - Non-existent user: HTTP **`200`** with `data: null` (no token exposed).

---

### Probe 4: Cross-Token / Superseding Token Probe — **PASS**
- **Command Executed:** `node /tmp/adv_c1_probe.l7ZXQl/run-probes.js` (Probe 4 block)
- **Attack / Token-Superseding Sequence Tested:**
  - Created user `adv_c1_supersede_1795010875808_bbw0sq@example.com`.
  - Requested token `T1`, then requested token `T2` for the same user.
  - Verified DB state of `T1` vs `T2`, attempted reset with `T1`, succeeded reset with `T2`, attempted replay of `T2`, and verified login with new vs old password.
- **Observed HTTP & DB Outputs:**
  - DB after `T2` issuance: `T1.usedAt = "2026-11-18T14:07:55.889Z"` (invalidated), `T2.usedAt = null`.
  - `POST /api/auth/reset-password` with superseded `T1`: HTTP **`400`**
    ```json
    {
      "success": false,
      "message": "Invalid or expired password reset token."
    }
    ```
  - `POST /api/auth/reset-password` with active `T2`: HTTP **`200`**
    ```json
    {
      "success": true,
      "message": "Password has been reset successfully. You can now sign in.",
      "data": null
    }
    ```
  - `POST /api/auth/reset-password` reusing `T2`: HTTP **`400`**
    ```json
    {
      "success": false,
      "message": "Invalid or expired password reset token."
    }
    ```
  - `POST /api/auth/login` with new password: HTTP **`200`**; with initial password: HTTP **`401`**.

---

## DB & Temp Directory Cleanup Confirmation

- `cleanupAdvUsers()` output from probe run:
  ```json
  {
    "deletedUserCount": 4,
    "remainingUsers": 0,
    "remainingTokens": 0
  }
  ```
- Temp directory cleanup command:
  `rm -rf /tmp/adv_c1_probe.l7ZXQl && test ! -e /tmp/adv_c1_probe.l7ZXQl && echo "TEMP_DIR_REMOVED"` -> `TEMP_DIR_REMOVED` (exit code `0`).
