-- Optional pin location for a Property, set via the map picker on the listing form.
-- All four columns are nullable: existing rows get NULL and keep working unchanged.
ALTER TABLE "Property" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "address" TEXT;
ALTER TABLE "Property" ADD COLUMN "placeId" TEXT;
