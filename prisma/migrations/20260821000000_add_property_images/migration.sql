-- Extra gallery photos for a listing, beyond the required cover photo stored on
-- Property.imageUrl. Purely additive — imageUrl and everywhere that reads it (homepage cards,
-- admin/approval lists) are untouched.
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");

ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
