ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE TABLE "EmailVerificationChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT,
    "userId" TEXT,
    "sessionVersion" INTEGER,
    "codeDigest" TEXT NOT NULL,
    "attemptsLeft" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "retryUntil" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailVerificationChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationChallenge_email_key" ON "EmailVerificationChallenge"("email");
CREATE INDEX "EmailVerificationChallenge_retryUntil_idx" ON "EmailVerificationChallenge"("retryUntil");
