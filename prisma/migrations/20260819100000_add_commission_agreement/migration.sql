-- 3% commission agreement, snapshotted per listing at the time the seller/agent accepts it
-- when creating the listing. Rate defaults to 3% but is adjustable per-listing by an admin
-- afterward; existing rows get the default rate and NULL agreement (nothing to backfill —
-- older listings predate this feature and simply show as "not yet agreed").
ALTER TABLE "Property" ADD COLUMN "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.03;
ALTER TABLE "Property" ADD COLUMN "commissionAgreedAt" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN "commissionAgreementText" TEXT;
