import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// Property photos ARE meant to be public (unlike supporting documents), so — unlike
// lib/documentStorage.ts — these are stored publicly either way: as public Vercel Blob objects
// in production (when BLOB_READ_WRITE_TOKEN is set), or under /public locally otherwise. Either
// way, imageUrl ends up directly usable as an <img src>.
const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "properties");

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function savePropertyImage(file: File, propertyId: string): Promise<string> {
  const ext = EXTENSION_BY_MIME[file.type] || path.extname(file.name) || "";
  const fileName = `${crypto.randomUUID()}${ext}`;

  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    const result = await put(`properties/${propertyId}/${fileName}`, file, {
      access: "public",
      contentType: file.type,
    });
    return result.url;
  }

  const dir = path.join(PUBLIC_UPLOAD_ROOT, propertyId);
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);

  // Public URL path Next.js will serve this at, since it's under /public.
  return `/uploads/properties/${propertyId}/${fileName}`;
}

// Best-effort — an image that fails to delete just becomes an orphaned file/blob,
// not a broken listing, so this never throws.
export async function deletePropertyImage(imageUrl: string | null) {
  if (!imageUrl) return;

  if (imageUrl.startsWith("http")) {
    if (!isBlobConfigured()) return; // not one of ours to delete (e.g. a legacy external URL)
    const { del } = await import("@vercel/blob");
    await del(imageUrl).catch(() => {});
    return;
  }

  if (!imageUrl.startsWith("/uploads/properties/")) return;

  const relativePath = imageUrl.replace(/^\/uploads\/properties\//, "");
  const filePath = path.join(PUBLIC_UPLOAD_ROOT, relativePath);
  await fs.unlink(filePath).catch(() => {});
}
