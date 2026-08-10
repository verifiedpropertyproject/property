import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";

// Deliberately not under /public — files are only ever reachable through the
// authenticated download route (app/api/documents/[id]/route.ts), not by URL.
// Local-disk fallback root, used when BLOB_READ_WRITE_TOKEN isn't set (e.g. local dev).
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per file
export const MAX_FILES_PER_UPLOAD = 10;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function isAllowedFileType(mimeType: string) {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function randomStoredName(originalName: string) {
  const ext = path.extname(originalName);
  return `${crypto.randomUUID()}${ext}`;
}

function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function localPath(propertyId: string, storedName: string) {
  return path.join(UPLOAD_ROOT, propertyId, storedName);
}

function blobPathname(propertyId: string, storedName: string) {
  return `documents/${propertyId}/${storedName}`;
}

/**
 * Saves a supporting document's bytes. In production (BLOB_READ_WRITE_TOKEN set), stores it as
 * a PRIVATE Vercel Blob object — genuinely access-gated by Vercel, not just an obscure public
 * URL, since the SDK's `get`/`del` for private blobs require the store's token. Locally, falls
 * back to disk under a directory that's never served by Next.js (not under /public), and access
 * is gated by our own auth check in the download route either way.
 */
export async function saveDocument(file: File, propertyId: string, storedName: string): Promise<void> {
  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    await put(blobPathname(propertyId, storedName), file, {
      access: "private",
      contentType: file.type,
    });
    return;
  }

  const dir = path.join(UPLOAD_ROOT, propertyId);
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(localPath(propertyId, storedName), buffer);
}

export async function readDocument(propertyId: string, storedName: string): Promise<Buffer> {
  if (isBlobConfigured()) {
    const { get } = await import("@vercel/blob");
    const result = await get(blobPathname(propertyId, storedName), { access: "private" });
    if (!result || result.statusCode !== 200) {
      throw new Error("Document not found in storage.");
    }
    const chunks: Uint8Array[] = [];
    const reader = result.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
  }

  return fs.readFile(localPath(propertyId, storedName));
}

// Best-effort — a document that fails to delete just becomes an orphaned file/blob,
// not a broken app, so this never throws.
export async function deleteDocument(propertyId: string, storedName: string): Promise<void> {
  if (isBlobConfigured()) {
    const { del } = await import("@vercel/blob");
    await del(blobPathname(propertyId, storedName)).catch(() => {});
    return;
  }

  await fs.unlink(localPath(propertyId, storedName)).catch(() => {});
}
