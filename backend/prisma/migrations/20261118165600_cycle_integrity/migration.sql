BEGIN;

-- Preserve history and keep the same newest cycle the API selected before this migration.
WITH ranked AS (
    SELECT "id", row_number() OVER (
        PARTITION BY "userId" ORDER BY "createdAt" DESC, "id" DESC
    ) AS position
    FROM "Cycle" WHERE "isActive"
)
UPDATE "Cycle" SET "isActive" = false
FROM ranked WHERE "Cycle"."id" = ranked."id" AND ranked.position > 1;

CREATE UNIQUE INDEX "Cycle_one_active_per_user" ON "Cycle" ("userId") WHERE "isActive";
CREATE INDEX "Cycle_userId_startDate_id_idx" ON "Cycle" ("userId", "startDate", "id");
CREATE INDEX "DailyLog_cycleId_idx" ON "DailyLog" ("cycleId");
CREATE INDEX "PlannedAction_logId_idx" ON "PlannedAction" ("logId");

COMMIT;
