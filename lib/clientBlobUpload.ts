"use client";

import { upload } from "@vercel/blob/client";
import { userUploadPrefix } from "@/lib/propertyUploadUrls";

// Browser-side helper: sends a file straight to Vercel Blob (bypassing Vercel's ~4.5MB request
// limit on our own API routes) and returns its public URL. Returns null if Blob isn't set up
// (local development) so the caller can fall back to posting the file in the form as before.

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export async function uploadPropertyMedia(file: File, userId: string): Promise<string | null> {
  const ext = EXT_BY_TYPE[file.type] || "";
  const pathname = `${userUploadPrefix(userId)}${crypto.randomUUID()}${ext}`;

  try {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/uploads/property",
      contentType: file.type,
      multipart: file.size > 5 * 1024 * 1024,
    });
    return blob.url;
  } catch (err: any) {
    // 501 from our token route = Blob not configured here (local dev) -> let the caller fall back.
    if (typeof err?.message === "string" && /not configured|501/i.test(err.message)) return null;
    throw err;
  }
}
