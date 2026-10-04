-- Referral purchase confirmation. A reward is only "earned" once an admin has confirmed the
-- referred buyer's purchase (buyers pay outside the site, so this is a manual check). See
-- lib/referral.ts (getReferralStage) and app/api/admin/referrals/[id]/status/route.ts.
ALTER TABLE "Referral" ADD COLUMN "purchaseConfirmedAt" TIMESTAMP(3);
ALTER TABLE "Referral" ADD COLUMN "purchaseNote" TEXT;
ALTER TABLE "Referral" ADD COLUMN "purchaseConfirmedBy" TEXT;
ALTER TABLE "Referral" ADD COLUMN "paymentReference" TEXT;

-- Referrals that were already marked PAID before this change were paid on the old "reward on
-- signup" rules, so treat their purchase as confirmed at the time they were paid. Everything
-- else starts as "awaiting purchase" and an admin can confirm it from the dashboard.
UPDATE "Referral"
SET "purchaseConfirmedAt" = COALESCE("paidAt", "createdAt"),
    "purchaseNote" = 'Paid before purchase confirmation was introduced.'
WHERE "payoutStatus" = 'PAID' AND "purchaseConfirmedAt" IS NULL;
