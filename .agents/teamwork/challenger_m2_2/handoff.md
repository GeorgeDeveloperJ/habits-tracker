# Handoff Report — `challenger_m2_2` (Milestone M2 Adversarial Challenger 2)

**Overall Verdict:** **PASS** (3 / 3 adversarial probes passed; zero repository files modified; all probe rows, scratch DB, and temporary directory cleaned up).

---

## Probe 1: `400` vs `401` Status Hygiene Probe

- **Result:** **PASS**
- **Command Executed (from `backend/` using isolated temp script in `mktemp -d` `/tmp/challenger_m2_2_S2Uskk`):**
  ```bash
  NODE_ENV=test NODE_PATH=/home/antigravity/GeorgeDeveloperJ/habits-tracker/backend/node_modules npx tsx /tmp/challenger_m2_2_S2Uskk/probe_http.ts
  ```
- **Observed HTTP Outputs:**
  - `POST /api/auth/forgot-password` (31 total invalid/public cases across both routes, all without `Authorization` header unless explicitly testing invalid `Authorization` header):
    - `{}` -> `HTTP 400` `{"success":false,"message":"Email is required.",...}`
    - `undefined` (missing body) -> `HTTP 400` `{"success":false,"message":"Email is required.",...}`
    - `{ email: "" }` -> `HTTP 400` `{"success":false,"message":"Email is required.",...}`
    - `{ email: "   " }` -> `HTTP 400` `{"success":false,"message":"Email is required.",...}`
    - `{ email: "not-an-email" }` -> `HTTP 400` `{"success":false,"message":"Invalid email address.",...}`
    - `{ email: 12345 }` -> `HTTP 400` `{"success":false,"message":"Expected string, received number",...}`
    - `{ email: null }` -> `HTTP 400` `{"success":false,"message":"Expected string, received null",...}`
    - `{ email: true }` -> `HTTP 400` `{"success":false,"message":"Expected string, received boolean",...}`
    - `{ email: ["a@b.com"] }` -> `HTTP 400` `{"success":false,"message":"Expected string, received array",...}`
    - `{ email: { address: "a@b.com" } }` -> `HTTP 400` `{"success":false,"message":"Expected string, received object",...}`
    - `{ email: "bad" }` + `Authorization: Bearer invalid.jwt.token` -> `HTTP 400` `{"success":false,"message":"Invalid email address.",...}`
    - Unregistered valid email `{ email: "adv_c2_nonexistent@example.com" }` (no `Authorization` header) -> `HTTP 200` `{"success":true,"message":"If an account with that email exists, password reset instructions have been generated.","data":null}`
    - Unregistered valid email + `Authorization: Bearer invalid.token.here` -> `HTTP 200` `{"success":true,"message":"If an account with that email exists, password reset instructions have been generated.","data":null}`
  - `POST /api/auth/reset-password`:
    - `{}` -> `HTTP 400` `{"success":false,"message":"Reset token is required.",...}`
    - `undefined` (missing body) -> `HTTP 400` `{"success":false,"message":"Reset token is required.",...}`
    - `{ password: "NewPassword123!" }` (missing token) -> `HTTP 400` `{"success":false,"message":"Reset token is required.",...}`
    - `{ token: "f".repeat(64) }` (missing password) -> `HTTP 400` `{"success":false,"message":"Password is required.",...}`
    - `{ token: "   ", password: "NewPassword123!" }` -> `HTTP 400` `{"success":false,"message":"Reset token is required.",...}`
    - `{ token: "\t\n ", password: "NewPassword123!" }` -> `HTTP 400` `{"success":false,"message":"Reset token is required.",...}`
    - `{ token: "", password: "NewPassword123!" }` -> `HTTP 400` `{"success":false,"message":"Reset token is required.",...}`
    - `{ token: "f".repeat(64), password: "12345" }` (5-char password) -> `HTTP 400` `{"success":false,"message":"Password must be at least 6 characters long.",...}`
    - `{ token: "f".repeat(64), password: "NewPassword123!" }` (unknown 64-hex token) -> `HTTP 400` `{"success":false,"message":"Invalid or expired password reset token."}`
    - `{ token: "abc123", password: "NewPassword123!" }` (wrong-length short token) -> `HTTP 400` `{"success":false,"message":"Invalid or expired password reset token."}`
    - `{ token: "a".repeat(128), password: "NewPassword123!" }` (wrong-length 128-hex token) -> `HTTP 400` `{"success":false,"message":"Invalid or expired password reset token."}`
    - Non-string `token` (`123456`, `null`, `[valid64Hex]`, `{ t: valid64Hex }`) -> all `HTTP 400` (`Expected string, received ...`)
    - Non-string `password` (`123456`, `null`, `true`, `["NewPassword123!"]`) -> all `HTTP 400` (`Expected string, received ...`)
    - Unknown token + `Authorization: Bearer invalid.jwt.token` -> `HTTP 400` `{"success":false,"message":"Invalid or expired password reset token."}`
- **Conclusion:** Every invalid/failure case returned `400` (never `401` or `500`), and neither route requires an `Authorization` header.

---

## Probe 2: Case-Insensitive Email & Whitespace Normalization Probe

- **Result:** **PASS**
- **Command Executed:** Same isolated script `/tmp/challenger_m2_2_S2Uskk/probe_http.ts` (`NODE_ENV=test`), exit code `0`.
- **Observed HTTP & DB Outputs:**
  1. **Mixed-case registration -> uppercase + padded whitespace `forgot-password` -> padded token `reset-password`:**
     - `POST /api/auth/register` (`adv_c2_MixedCase_1795011467303@Example.COM`) -> `HTTP 201` (`id=ec42c782-54e4-44cb-a721-bc98f09daf29`)
     - `POST /api/auth/forgot-password` (`"  ADV_C2_MIXEDCASE_1795011467303@example.com  "`) -> `HTTP 200`, `resetToken` length `64` hex chars (`d73c269c...`)
     - DB check (`PasswordResetToken` by SHA-256 `tokenHash`): `found=true`, `userIdMatch=true`, `usedAt=null`
     - `POST /api/auth/reset-password` with padded token `"  \t" + rawToken + " \n "` -> `HTTP 200` `{"success":true,"message":"Password has been reset successfully. You can now sign in.","data":null}`
     - DB check after reset: `usedAt=2026-11-18T14:17:47.393Z`
     - `POST /api/auth/login` with old password -> `HTTP 401`
     - `POST /api/auth/login` with new password -> `HTTP 200` (`id=ec42c782-54e4-44cb-a721-bc98f09daf29`, valid JWT returned)
  2. **Lowercase registration -> uppercase + `\t`/`\n` whitespace `forgot-password` -> padded token `reset-password`:**
     - `POST /api/auth/register` (`adv_c2_lowercase_1795011467303@example.com`) -> `HTTP 201` (`id=4a3dbdfc-b733-4fcb-9e25-a5a1a4ceede2`)
     - `POST /api/auth/forgot-password` (`"\t  ADV_C2_LOWERCASE_1795011467303@EXAMPLE.COM \n"`) -> `HTTP 200`, `resetToken` length `64` hex chars
     - DB check (`PasswordResetToken` by SHA-256 `tokenHash`): `found=true`, `userIdMatch=true`, `usedAt=null`
     - `POST /api/auth/reset-password` with padded token -> `HTTP 200` `{"success":true,"message":"Password has been reset successfully. You can now sign in.","data":null}`
     - DB check after reset: `usedAt=2026-11-18T14:17:47.691Z`
     - `POST /api/auth/login` with old password -> `HTTP 401`
     - `POST /api/auth/login` with new password -> `HTTP 200` (`id=4a3dbdfc-b733-4fcb-9e25-a5a1a4ceede2`, valid JWT returned)

---

## Probe 3: SQL Migration Fresh-Apply & Idempotency Probe (`prisma migrate deploy`)

- **Result:** **PASS**
- **Commands Executed (from `backend/`):**
  ```bash
  psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE habits_m2_probe_db;"
  DATABASE_URL="postgresql://postgres@127.0.0.1:5432/habits_m2_probe_db?schema=public" npx prisma migrate deploy
  DATABASE_URL="postgresql://postgres@127.0.0.1:5432/habits_m2_probe_db?schema=public" npx prisma migrate deploy
  psql -h 127.0.0.1 -U postgres -d habits_m2_probe_db -c '\d "PasswordResetToken"'
  psql -h 127.0.0.1 -U postgres -d habits_m2_probe_db -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'PasswordResetToken' ORDER BY ordinal_position;"
  psql -h 127.0.0.1 -U postgres -d habits_m2_probe_db -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'PasswordResetToken' ORDER BY indexname;"
  psql -h 127.0.0.1 -U postgres -d habits_m2_probe_db -c "SELECT rc.constraint_name, rc.update_rule, rc.delete_rule, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column FROM information_schema.referential_constraints rc JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name WHERE kcu.table_name = 'PasswordResetToken';"
  psql -h 127.0.0.1 -U postgres -d habits_m2_probe_db -c "SELECT migration_name, finished_at IS NOT NULL AS finished, rolled_back_at FROM _prisma_migrations ORDER BY started_at;"
  psql -h 127.0.0.1 -U postgres -c "DROP DATABASE habits_m2_probe_db;"
  ```
- **Observed Outputs:**
  - **Run 1:**
    ```text
    2 migrations found in prisma/migrations
    Applying migration `20260606191105_added_user_model`
    Applying migration `20261118140207_add_password_reset_tokens`
    All migrations have been successfully applied.
    ```
  - **Run 2 (Idempotency):**
    ```text
    2 migrations found in prisma/migrations
    No pending migrations to apply.
    ```
  - **Schema, Indexes & Foreign Key Verification (`\d "PasswordResetToken"` & `information_schema`):**
    - Columns: `id` (`text`, `NO`, PK), `tokenHash` (`text`, `NO`), `userId` (`text`, `NO`), `expiresAt` (`timestamp(3) without time zone`, `NO`), `usedAt` (`timestamp(3) without time zone`, `YES`), `createdAt` (`timestamp(3) without time zone`, `NO`, `CURRENT_TIMESTAMP`).
    - Indexes:
      - `"PasswordResetToken_pkey"` (`PRIMARY KEY, btree (id)`)
      - `"PasswordResetToken_tokenHash_key"` (`UNIQUE, btree ("tokenHash")`)
      - `"PasswordResetToken_userId_idx"` (`btree ("userId")`)
      - `"PasswordResetToken_expiresAt_idx"` (`btree ("expiresAt")`)
    - Foreign Key (`information_schema.referential_constraints`):
      - `"PasswordResetToken_userId_fkey"`: `userId` -> `"User"(id)`, `update_rule = CASCADE`, `delete_rule = CASCADE`.
    - `_prisma_migrations`: Both `20260606191105_added_user_model` and `20261118140207_add_password_reset_tokens` have `finished = t`, `rolled_back_at = NULL`.

---

## Cleanup Confirmation

- **Probe DB Rows (`habits_tracker_db`):** `[CLEANUP] Deleted probe rows: tokens=2, users=2`; verified via `psql`:
  ```sql
  SELECT count(*) AS remaining_adv_c2_users FROM "User" WHERE email ILIKE 'adv_c2_%';
  -- remaining_adv_c2_users: 0
  ```
- **Temporary Scratch Database:** `DROP DATABASE habits_m2_probe_db;` succeeded; `psql -lqt` lists only `habits_tracker_db`, `postgres`, `template0`, `template1`.
- **Isolated Temp Directory:** `rm -rf /tmp/challenger_m2_2_S2Uskk` succeeded (`test ! -d /tmp/challenger_m2_2_S2Uskk` passed).
- **Working Tree Integrity:** Zero repository source files modified by `challenger_m2_2`; only `.agents/teamwork/challenger_m2_2/progress.md` and `.agents/teamwork/challenger_m2_2/handoff.md` were written.
