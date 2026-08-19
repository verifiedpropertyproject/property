-- Full audit trail for commission agreements: one row per signing, capturing the typed
-- signature name, IP, user agent, and a link to the generated PDF certificate. Purely
-- additive — Property.commissionRate/commissionAgreedAt/commissionAgreementText (added in a
-- previous migration) are untouched and keep working as the "latest at signing" cache.
CREATE TABLE "CommissionAgreement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "agreementVersion" INTEGER NOT NULL,
    "agreementText" TEXT NOT NULL,
    "signedName" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionAgreement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommissionAgreement_propertyId_idx" ON "CommissionAgreement"("propertyId");
CREATE INDEX "CommissionAgreement_userId_idx" ON "CommissionAgreement"("userId");

ALTER TABLE "CommissionAgreement" ADD CONSTRAINT "CommissionAgreement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommissionAgreement" ADD CONSTRAINT "CommissionAgreement_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
