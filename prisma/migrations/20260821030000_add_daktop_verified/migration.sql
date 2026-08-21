-- Cached/derived flag: true once every document is received and location/ownership/survey are
-- all verified and the Daktop decision is Safe to buy — recomputed server-side, never set
-- directly by an admin. Lets listing cards show the "DAKTOP VERIFIED" badge without joining in
-- documents on every read.
ALTER TABLE "Property" ADD COLUMN "daktopVerified" BOOLEAN NOT NULL DEFAULT false;
