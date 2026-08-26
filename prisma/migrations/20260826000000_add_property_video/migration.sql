-- Optional walkthrough video for a listing, stored the same way as the existing cover photo
-- (imageUrl). Purely additive and nullable — existing listings simply have no video yet.
ALTER TABLE "Property" ADD COLUMN "videoUrl" TEXT;
