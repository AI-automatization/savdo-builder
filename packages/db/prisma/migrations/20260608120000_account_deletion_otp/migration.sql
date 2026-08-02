-- ACCOUNT-DELETION-OTP-001
-- Dedicated OTP table for account-deletion flow. Otp codes are scoped per-user
-- (not per-phone like otp_requests) — because the user is already authenticated
-- when initiating self-deletion and we want the OTP tied to the user id, so it
-- doesn't collide with login/register/checkout OTPs in flight on the same phone.
--
-- Hard-delete is performed by the BullMQ cron 90 days after User.deletedAt
-- (see purge-deleted-users.processor.ts — TODO next turn). When the user row
-- is hard-deleted, ON DELETE CASCADE here also wipes any leftover deletion
-- OTPs automatically.

CREATE TABLE "account_deletion_otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "account_deletion_otps_pkey" PRIMARY KEY ("id")
);

-- Partial index speeds up the hot path: "find the active (not-yet-consumed)
-- deletion OTP for this user" during /confirm. Tiny because most rows are
-- consumed quickly or hard-deleted with the user.
CREATE INDEX "account_deletion_otps_active_idx"
    ON "account_deletion_otps" ("userId", "consumedAt")
    WHERE "consumedAt" IS NULL;

CREATE INDEX "account_deletion_otps_expiresAt_idx"
    ON "account_deletion_otps" ("expiresAt");

ALTER TABLE "account_deletion_otps"
    ADD CONSTRAINT "account_deletion_otps_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
