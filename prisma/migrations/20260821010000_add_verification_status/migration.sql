-- Admin-controlled due-diligence trust signals, shown publicly on a listing's detail page:
-- whether the location and ownership have been checked, and Daktop's overall verdict. All
-- default to their "not yet checked" state so existing rows keep working unchanged.
ALTER TABLE "Property" ADD COLUMN "locationVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "ownershipVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "daktopDecision" TEXT NOT NULL DEFAULT 'PENDING';

-- Admin confirmation that a submitted document has actually been reviewed/received, separate
-- from merely being uploaded by the lister.
ALTER TABLE "PropertyDocument" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;
