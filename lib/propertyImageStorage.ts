import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// Property photos ARE meant to be public (unlike supporting documents), so — unlike
// lib/documentStorage.ts — these are stored publicly either way: as public Vercel Blob objects
// in production, or under /public locally otherwise. Either way, imageUrl ends up directly
// usable as an <img src>.
//
// This project has two separate Vercel Blob stores (photos here, documents in
// lib/documentStorage.ts), so each needs its own explicitly-named token rather than relying on
// @vercel/blob's default BLOB_READ_WRITE_TOKEN lookup — that name isn't safe to share between
// two stores connected to the same project.
const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "properties");
const PROPERTY_BLOB_TOKEN = process.env.PROPERTY_BLOB_READ_WRITE_TOKEN;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const VIDEO_EXTENSION_BY_MIME: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

function isBlobConfigured() {
  return Boolean(PROPERTY_BLOB_TOKEN);
}

export async function savePropertyImage(file: File, propertyId: string): Promise<string> {
  const ext = EXTENSION_BY_MIME[file.type] || path.extname(file.name) || "";
  const fileName = `${crypto.randomUUID()}${ext}`;

  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    const result = await put(`properties/${propertyId}/${fileName}`, file, {
      access: "public",
      contentType: file.type,
      token: PROPERTY_BLOB_TOKEN,
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
    await del(imageUrl, { token: PROPERTY_BLOB_TOKEN }).catch(() => {});
    return;
  }

  if (!imageUrl.startsWith("/uploads/properties/")) return;

  const relativePath = imageUrl.replace(/^\/uploads\/properties\//, "");
  const filePath = path.join(PUBLIC_UPLOAD_ROOT, relativePath);
  await fs.unlink(filePath).catch(() => {});
}

// Same storage backend as photos (public Blob store in production, /public locally) — a
// listing's video just lives alongside its photos under the same propertyId folder/prefix.
export async function savePropertyVideo(file: File, propertyId: string): Promise<string> {
  const ext = VIDEO_EXTENSION_BY_MIME[file.type] || path.extname(file.name) || "";
  const fileName = `${crypto.randomUUID()}${ext}`;

  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    const result = await put(`properties/${propertyId}/${fileName}`, file, {
      access: "public",
      contentType: file.type,
      token: PROPERTY_BLOB_TOKEN,
    });
    return result.url;
  }

  const dir = path.join(PUBLIC_UPLOAD_ROOT, propertyId);
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);

  return `/uploads/properties/${propertyId}/${fileName}`;
}

// Videos are stored under the exact same URL scheme as photos, so removing one just reuses the
// photo-deletion logic (this alias exists purely for readability at call sites).
export const deletePropertyVideo = deletePropertyImage;
