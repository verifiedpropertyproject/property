import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// Same storage strategy as lib/propertyImageStorage.ts (public Vercel Blob in production,
// /public locally) but under its own "gallery" prefix/folder since these images belong to the
// site as a whole, not to any single property. Reuses the same PROPERTY_BLOB_READ_WRITE_TOKEN
// store as property photos — both are public image stores, so there's no need for a third
// separate Blob token just for this.
const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "gallery");
const GALLERY_BLOB_TOKEN = process.env.PROPERTY_BLOB_READ_WRITE_TOKEN;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function isBlobConfigured() {
  return Boolean(GALLERY_BLOB_TOKEN);
}

export async function saveGalleryImage(file: File): Promise<string> {
  const ext = EXTENSION_BY_MIME[file.type] || path.extname(file.name) || "";
  const fileName = `${crypto.randomUUID()}${ext}`;

  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    const result = await put(`gallery/${fileName}`, file, {
      access: "public",
      contentType: file.type,
      token: GALLERY_BLOB_TOKEN,
    });
    return result.url;
  }

  await fs.mkdir(PUBLIC_UPLOAD_ROOT, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(PUBLIC_UPLOAD_ROOT, fileName), buffer);

  // Public URL path Next.js will serve this at, since it's under /public.
  return `/uploads/gallery/${fileName}`;
}

// Best-effort — an image that fails to delete just becomes an orphaned file/blob, not a broken
// page, so this never throws.
export async function deleteGalleryImage(imageUrl: string | null) {
  if (!imageUrl) return;

  if (imageUrl.startsWith("http")) {
    if (!isBlobConfigured()) return; // not one of ours to delete (e.g. a legacy external URL)
    const { del } = await import("@vercel/blob");
    await del(imageUrl, { token: GALLERY_BLOB_TOKEN }).catch(() => {});
    return;
  }

  if (!imageUrl.startsWith("/uploads/gallery/")) return;

  const fileName = imageUrl.replace(/^\/uploads\/gallery\//, "");
  await fs.unlink(path.join(PUBLIC_UPLOAD_ROOT, fileName)).catch(() => {});
}
