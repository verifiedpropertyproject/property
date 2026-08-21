-- Admin-controlled trust signal: whether the plot has been physically surveyed/beacons checked
-- against the title, distinct from ownershipVerified (paperwork) added previously.
ALTER TABLE "Property" ADD COLUMN "surveyVerified" BOOLEAN NOT NULL DEFAULT false;
