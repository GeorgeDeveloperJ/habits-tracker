BEGIN;

-- Stop before changing identities if case variants belong to different accounts.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "User" GROUP BY lower("email") HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Resolve case-insensitive account email collisions before deploying';
    END IF;
END $$;

UPDATE "User" SET "email" = lower("email") WHERE "email" <> lower("email");
ALTER TABLE "User"
    ADD CONSTRAINT "User_email_canonical_check" CHECK ("email" = lower("email")),
    ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Retire previously issued recovery links which may have appeared in responses or logs.
UPDATE "PasswordResetToken" SET "usedAt" = CURRENT_TIMESTAMP WHERE "usedAt" IS NULL;

CREATE TABLE "AuthRateBucket" (
    "key" TEXT PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "AuthRateBucket_expiresAt_idx" ON "AuthRateBucket" ("expiresAt");

COMMIT;
