-- Site-wide homepage gallery — admin-uploaded infographic/promo images shown in a slow
-- auto-scrolling carousel on the homepage. Entirely separate from PropertyImage above (which
-- belongs to a single listing); this is one shared pool of images for the whole site.
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GalleryImage_uploadedById_idx" ON "GalleryImage"("uploadedById");

ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
