-- Super-admin-only pause/resume: temporarily hide an approved listing from public view
-- without deleting it or changing its review status. See app/api/properties/[id]/pause.
ALTER TABLE "Property" ADD COLUMN "paused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "pausedAt" TIMESTAMP(3);
