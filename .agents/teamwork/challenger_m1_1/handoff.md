# Handoff Report — `challenger_m1_1` (Milestone `M1` Iteration 1)

**Handoff Type**: Hard (Adversarial Challenge Complete)  
**Verdict**: **REJECT / REQUEST_CHANGES**  
**Overall Risk Assessment**: **HIGH**  
**Date**: 2026-11-18T05:35:00Z

---

## Challenge Summary

**Overall risk assessment**: **HIGH**

All **8 Cross-Tenant probes (`CT-01`–`CT-08`)** and **JWT/Input Boundary probes (`AB-01`–`AB-03`)** were successfully defended. However, empirical adversarial probing reproduced **9 concrete bugs** across state machine immutability, concurrency/idempotency, Day 31 boundary math, and auth edge cases — including **2 HIGH-severity** state-machine flaws (`SM-05` closed-day reopening bypass and `SM-07`/`SM-07b` concurrent `DailyLog`/`PlannedAction` duplication that permanently deadlocks Close Today) and **4 MEDIUM-severity** flaws (`SM-06`, `SM-09`, `AB-04`, `AB-05`).

---

## 1. Observation

### Test Execution Environment
- Ran two isolated TypeScript probe scripts via `backend/node_modules/.bin/tsx` inside a temporary `chmod 700` directory (`/tmp/teamwork_probe.J4RLVM`, deleted after execution) against the Express `app` (`backend/src/index.ts`, `NODE_ENV=test`) bound to ephemeral `127.0.0.1:0` and connected to PostgreSQL 15 (`127.0.0.1:5432/habits_tracker_db`).
- All test users used unique `ch1_probe_<timestamp>_*` prefixes and were deleted in `finally`; final check confirmed `REMAINING_PROBE_USERS=0` and `TEMP_DIR_REMOVED`.

### Defended Probes (Verbatim Outcomes)
- **Cross-Tenant Isolation (`CT-01`–`CT-08`)**:
  - `CT-01` (`GET /api/cycles/history` as User B): `status=200, leaked=false, count=1`
  - `CT-02` (`GET /api/cycle-progress/:userACycleId` as User B): `status=404, message=Cycle not found.`
  - `CT-03` (`POST /api/days { cycleId: userACycleId }` as User B): `status=400, logsInCycleA=1`
  - `CT-04` (`GET /api/days?cycleId=userACycleId` as User B): `status=200, returned=0`
  - `CT-05` (`PATCH /api/days/:userALogId { isClosed: true, forceClose: true }` as User B): `status=404, logA.isClosed=false`
  - `CT-06` (`POST /api/actions { logId: userALogId }` as User B): `status=404, message=Daily log not found`
  - `CT-07` (`PATCH /api/actions/:userAActionId` as User B): `status=404`
  - `CT-08` (`DELETE /api/actions/:userAActionId` as User B): `status=404`
- **Sequential Gatekeeper & Validation (`SM-01`–`SM-04`, `SM-08`, `AB-01`–`AB-03`)**:
  - `SM-01` (7/8 tomorrow pillars): `status=400, plannedPillarsCount=7, requiredPillars=8`
  - `SM-02` (8 tomorrow rows across 7 distinct categories): `status=400, plannedPillarsCount=7`
  - `SM-03` (whitespace-only 8th pillar via API & DB): `wsApi=400, closeWs=400`
  - `SM-04` (closed day action locks): `closeOk=200, postTarget=400, postLogId=400, patch=400, del=400`
  - `SM-08` (`POST /api/cycles` invalid `categoryId` in `initialGoals`): `bad1=400, bad2=400, totalCycles=1, origActive=true`
  - `AB-01` (malformed UUIDs & SQLi strings): `prog=404, sqli=404, daysQ=200, patchDay=404, patchAct=404, delAct=404, postDayBody=400, postActBody=400`
  - `AB-02` (empty/whitespace/`>500` char strings, empty PATCH, invalid JSON): all `400`
  - `AB-03` (missing/empty/`Basic`/expired/wrong-sig/tampered/`alg:none`/no-`id` JWTs): all `401`

### Confirmed Bugs & Vulnerabilities (Challenges)

#### [High] Challenge 1 (`SM-05`): Closed-Day Immutability Bypass via `PATCH /api/days/:id { isClosed: false }`
- **Code Observed**: `backend/src/controllers/day.controller.ts:153, 203-212` and `backend/src/middlewares/validate.ts:60-66`. `updateDay` only validates when `isClosed === true && !existingDay.isClosed`, and unconditionally applies `updateData.isClosed = isClosed` (`prisma.dailyLog.update`) even when `existingDay.isClosed === true` and `isClosed === false`.
- **Empirical Output**: `reopenStatus=200, isClosedNow=false, mutatedAfterReopen=true`.
- **Attack scenario**: User closes Today (`isClosed: true`), then sends `PATCH /api/days/:id` with `{ "isClosed": false }` to reopen the closed day, then freely `PATCH`/`DELETE`/`POST` actions on that day.
- **Blast radius**: Breaks the core closed-day immutability invariant (`PROJECT.md:14,39`); historical logs and analytics can be retroactively falsified after closing.
- **Mitigation**: In `updateDay`, reject `{ isClosed: false }` (or any update) when `existingDay.isClosed === true` with HTTP `400` (`"Closed daily logs cannot be reopened"`).

#### [High] Challenge 2 (`SM-07` & `SM-07b`): Race Condition Creates Duplicate `DailyLog` & `PlannedAction` Rows and Deadlocks Close Today
- **Code Observed**: `backend/src/controllers/day.controller.ts:53-80`, `backend/src/controllers/actions.controller.ts:62-82, 105-125`, `backend/prisma/schema.prisma:41-76` (no unique constraints on `(userId, cycleId, utcDay)` or `(logId, categoryId)`).
- **Empirical Output**:
  - `SM-07`: 10 concurrent `POST /api/days { targetDate: 'tomorrow' }` requests produced `dbLogsInCycle=3` (expected `2`: today + tomorrow) and `uniqueReturnedTomorrowIds=2`. 6 concurrent `POST /api/actions` requests for the same tomorrow pillar created `dbLogsInCycle=6` (5 duplicate tomorrow `DailyLog` rows!) and `dbActionsCreated=6` (6 duplicate `PlannedAction` rows for the same category).
  - `SM-07b`: Planning 8 distinct tomorrow pillars concurrently (`Promise.all` across all 8 `HabitCategory` IDs) split actions across duplicate tomorrow `DailyLog` rows (`dbLogsInCycle=3`). `GET /api/cycle-progress/current` reported `tomorrowPlannedCountReported=1`, and `PATCH /api/days/:todayId { isClosed: true }` failed with `closeStatus=400, closeMsg=Cannot close today until you have planned tomorrow's 8 pillars.`
- **Attack scenario**: Rapid UI clicks, double-submissions, or parallel "Plan Tomorrow" requests before `tomorrowLog` exists split tomorrow's goals across multiple `DailyLog` rows for the same UTC day.
- **Blast radius**: Corrupts `DailyLog` uniqueness, duplicates `PlannedAction` rows per pillar, skews `cycle-progress` counts, and **permanently deadlocks** the Close Today gatekeeper (since `findFirst` only inspects one of the duplicate tomorrow logs).
- **Mitigation**: Store a UTC calendar day key (e.g., `dayKey String` or normalized midnight `date` with `@@unique([userId, cycleId, date])`) on `DailyLog` and `@@unique([logId, categoryId])` on `PlannedAction`, use Prisma `upsert` / transaction + `P2002` retry/lookup.

#### [Medium] Challenge 3 (`SM-06`): Day 31 Close Gatekeeper Fails on Time-of-Day Boundary
- **Code Observed**: `backend/src/controllers/day.controller.ts:154-165` (`dayNumFromLog` and `dayNumFromNow` use `Math.floor((ts - cycleStartMs) / 86400000) + 1`, and `tomorrowStart.getTime() >= existingDay.cycle.endDate.getTime()`). Same pattern in `cycleProgress.controller.ts:72-73`.
- **Empirical Output**: For a cycle started 30 UTC calendar days prior at `23:30:00Z` (`start=2026-10-19T23:30:00.000Z`) and Day 31 log at `00:30:00Z` (`log=2026-11-18T00:30:00.000Z`), `PATCH /api/days/:id { isClosed: true }` failed with `calendarDay31TimeOfDayBoundaryStatus=400 body={"success":false,"message":"Cannot close today until you have planned tomorrow's 8 pillars.","plannedPillarsCount":0,"requiredPillars":8,...}`.
- **Attack scenario**: User starts a 31-day sprint late in the UTC day (e.g., `23:30 UTC`) and tries to close Day 31 earlier in the day (`00:30–23:29 UTC`) on the 31st calendar day.
- **Blast radius**: Blocks legitimate Day 31 completion until after the exact hour-of-day the sprint originally started (up to ~23h59m delay).
- **Mitigation**: Compute `dayNumber` and Day 31 finality using `getUtcDayBounds(cycle.startDate).startOfDay` rather than millisecond-offset from `cycle.startDate` time-of-day.

#### [Medium] Challenge 4 (`SM-09`): `POST /api/days` Allows Creating Logs on Inactive/Deactivated Cycles
- **Code Observed**: `backend/src/controllers/day.controller.ts:30-33` (`cycleId ? prisma.cycle.findFirst({ where: { id: cycleId, userId } }) : ...`) lacks `isActive: true` and `endDate` checks.
- **Empirical Output**: `POST /api/days { cycleId: deactivatedCycleId, targetDate: 'tomorrow' }` returned `status=201` and inserted a new `DailyLog` onto an inactive cycle.
- **Blast radius**: Historical/completed cycles can be polluted with new `DailyLog` rows after rollover.
- **Mitigation**: Filter `where: { id: cycleId, userId, isActive: true, endDate: { gte: new Date() } }` in `createDay` (or reject inactive cycles with `400`).

#### [Medium] Challenge 5 (`AB-04`): Concurrent Duplicate Registration Returns HTTP `500`
- **Code Observed**: `backend/src/controllers/auth.controller.ts:19-42` (`findUnique` check-then-create without handling Prisma `P2002`).
- **Empirical Output**: 5 concurrent `POST /api/auth/register` calls with the same email returned `statuses=[500,201,500,500,500], count201=1, count500=4` with logged `Unique constraint failed on the fields: (email)`.
- **Blast radius**: Unhandled `500` errors on concurrent/double-submit registration.
- **Mitigation**: Catch Prisma error code `P2002` in `register` and return HTTP `400` / `409` `{ success: false, message: 'User already exists.' }`.

#### [Medium] Challenge 6 (`AB-05`): Email Case Sensitivity Breaks Login & Allows Duplicate Accounts
- **Code Observed**: `backend/src/controllers/auth.controller.ts:9,18-19,47,56-57` and `backend/src/middlewares/validate.ts:21-25,32-36` trim emails without `.toLowerCase()`.
- **Empirical Output**: `regMixed=201, loginLower=401, regLowerDup=201 (201 means duplicate account created for same email!), regSpaced=201, loginSpaced=200`.
- **Attack scenario**: Register `User@Example.com`; login with `user@example.com` fails (`401`); another registration for `user@example.com` succeeds (`201`), creating two separate accounts for one email address.
- **Blast radius**: Authentication failures for users with mobile auto-capitalization and duplicate user accounts for identical case-insensitive email addresses.
- **Mitigation**: Normalize email with `.trim().toLowerCase()` in Zod (`registerSchema`, `loginSchema`) and `auth.controller.ts` (plus case-insensitive DB lookup if existing rows exist).

#### [Low] Additional Findings (`SM-10`, `SM-11`, `AB-06`)
- **`SM-10` — Concurrent `POST /api/cycles` Creates Multiple Active Cycles**: 4 parallel `POST /api/cycles` requests produced `activeCyclesCount=4` because `updateMany` + `create` (`cycle.controller.ts:30-45`) are not serialized/transactional.
- **`SM-11` — `POST /api/actions` Fallback Mutates Expired Cycle Log**: When a user has only an expired cycle (`endDate < now`), `actions.controller.ts:83-88` falls back to the user's latest `DailyLog` across all cycles and returns `status=201, attachedLogId===expLogId`.
- **`AB-06` — Valid JWT with Non-Existent `userId` Crashes with `500`**: A validly signed JWT for a non-existent/deleted `userId` triggers a Prisma FK `Cycle_userId_fkey` violation (`status=500`) on `POST /api/cycles` instead of `401`.

---

## 2. Logic Chain

1. Reading `day.controller.ts`, `actions.controller.ts`, `cycle.controller.ts`, `auth.controller.ts`, and `schema.prisma` surfaced check-then-act race windows, missing `isClosed === true` guard on `isClosed: false`, millisecond-based Day 31 math, missing `isActive` check on explicit `cycleId`, and non-lowercased email handling.
2. Executing 27 isolated HTTP/DB probes against the live Express app and PostgreSQL 15 empirically verified that cross-tenant isolation (`CT-01`–`CT-08`), Zod input limits (`AB-02`), malformed UUID resilience (`AB-01`), JWT signature/expiry/alg:none rejection (`AB-03`), and sequential 8-pillar gatekeeper rules (`SM-01`–`SM-04`, `SM-08`) all hold.
3. Simultaneously, empirical execution reproduced 9 bugs (`SM-05`, `SM-06`, `SM-07`, `SM-07b`, `SM-09`, `SM-10`, `SM-11`, `AB-04`, `AB-05`, `AB-06`), including 2 HIGH-severity defects where closed logs can be unlocked/edited and concurrent planning splits tomorrow's log and permanently blocks closing Today.
4. Because a user can bypass closed-day immutability (`SM-05`) and trigger a Close Day deadlock via parallel requests (`SM-07`/`SM-07b`), the milestone cannot be approved until the HIGH and MEDIUM findings are fixed and regression-tested.

---

## 3. Caveats

- **Design Note on `forceClose: true` (`SM-05b`)**: `PATCH /api/days/:id` accepts `{ isClosed: true, forceClose: true }`, which bypasses the 8-pillar tomorrow check (`status=200, isClosed=true`). This is explicitly documented in `PROJECT.md:41,144` and tested in `backend/tests/e2e.test.ts:703,1032`, so it is not flagged as a defect; however, if strict server-side discipline without client override is desired, `forceClose` should be removed or restricted.

### Unchallenged Areas
- **Frontend runtime / browser interaction** (XSS, React state races under live browser navigation, Playwright E2E) — out of scope for this backend adversarial challenge.
- **OS-level DoS / rate-limiting / body-size flood** (e.g., brute-force login rate limiting, Express payload size exhaustion) — not stress-tested.

---

## 4. Conclusion

**Verdict: REJECT / REQUEST_CHANGES.**  
Cross-tenant data isolation and JWT/Zod basics are solid, but backend state-machine immutability, concurrency/idempotency, Day 31 boundary calculation, and auth normalization have **6 actionable HIGH/MEDIUM bugs** (plus 3 LOW findings) that must be fixed and verified before M1 signoff:
1. Block reopening closed `DailyLog` rows (`PATCH /api/days/:id { isClosed: false }` -> `400`).
2. Eliminate `DailyLog` and `PlannedAction` check-then-create race conditions via schema uniqueness + transactional upsert/`P2002` handling (and wrap `startCycle` deactivate+create in a transaction).
3. Fix Day 31 & `dayNumber` math to use UTC calendar day boundaries (`getUtcDayBounds(startDate).startOfDay`).
4. Reject `POST /api/days` targeting inactive/expired `cycleId`s (`400`), and reject `POST /api/actions` when no active cycle exists.
5. Normalize emails to lowercase in `auth.controller.ts` / `validate.ts` and handle `P2002` in `register` as `400`/`409`.

---

## 5. Verification Method

After applying fixes in `backend/src/` and `backend/prisma/`:
1. Run `npx prisma migrate dev` / `deploy` and `npx prisma generate` in `/home/antigravity/GeorgeDeveloperJ/habits-tracker/backend`.
2. Run canonical checks:
   ```bash
   npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend run typecheck
   npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend run build
   npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend test
   ```
3. Add regression tests in `backend/tests/e2e.test.ts` covering:
   - `PATCH /api/days/:closedId` with `{ isClosed: false }` returns `400` and keeps `isClosed: true`.
   - Concurrent `Promise.all` bursts of `POST /api/days` (`targetDate: 'tomorrow'`), `POST /api/actions` (both same-category and 8-distinct-categories), `POST /api/cycles`, and `POST /api/auth/register` produce zero duplicate logs/actions/active-cycles and zero `500` responses, and `Close Today` succeeds (`200`).
   - Day 31 close succeeds when `startDate` was 30 UTC calendar days ago at `23:30:00Z` and Today's log is at `00:30:00Z`.
   - `POST /api/days` with an inactive `cycleId` returns `400`.
   - Mixed-case email registration + lowercase login succeeds (`200`), and lowercase re-registration fails (`400`).
   **Invalidation conditions**: Any `500` response, duplicate `DailyLog`/`PlannedAction` row per day/category, reopened closed log, or failed Day 31 close on the 31st UTC calendar day.
