-- Seller/agent-initiated identity check workflow: request from the dashboard or listing form,
-- reviewed by an admin. Purely additive/nullable-or-defaulted — existing users simply start at
-- "NOT_SUBMITTED".
ALTER TABLE "User" ADD COLUMN "identityVerificationStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED';
ALTER TABLE "User" ADD COLUMN "identityVerificationRequestedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "identityVerificationReviewedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "identityVerificationNote" TEXT;
