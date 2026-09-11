-- Refer & earn. See lib/referral.ts for the reward amount and labels, app/api/register/route.ts
-- for how a referral is created, and app/api/admin/referrals/[id]/payout/route.ts for how an
-- admin marks one as paid out.

-- Add referralCode as nullable first so existing rows don't fail the NOT NULL check, backfill a
-- code for every pre-existing user from their id (already unique, so this can't collide), then
-- lock it down.
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

UPDATE "User" SET "referralCode" = upper(right(id, 8)) WHERE "referralCode" IS NULL;

ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "payoutStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
