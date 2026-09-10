-- Optional resale category badge for admin-listed resale properties (Auction, Standard Resale,
-- Distressed Sale, Foreclosure). Null for every other listing. See the resaleCategory comment
-- in prisma/schema.prisma for the full explanation.
ALTER TABLE "Property" ADD COLUMN "resaleCategory" TEXT;
