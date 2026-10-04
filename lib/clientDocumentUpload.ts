"use client";

import { upload } from "@vercel/blob/client";

// Browser-side helper for supporting documents: sends the file straight to the private Vercel Blob
// store (Vercel rejects request bodies over ~4.5MB on our own API routes) and returns the stored
// name to record against the listing. Returns null if Blob isn't set up (local dev) so the caller
// can fall back to posting the file in the form like before.

export async function uploadDocumentDirect(
  file: File,
  propertyId: string
): Promise<{ storedName: string; fileName: string } | null> {
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 9) : "";
  const storedName = `${crypto.randomUUID()}${ext && ext !== "." ? ext : ""}`;

  try {
    await upload(`documents/${propertyId}/${storedName}`, file, {
      access: "private",
      handleUploadUrl: "/api/uploads/document",
      clientPayload: propertyId,
      contentType: file.type,
      multipart: file.size > 5 * 1024 * 1024,
    });
    return { storedName, fileName: file.name };
  } catch (err: any) {
    // 501 from our token route = Blob not configured here (local dev) -> caller falls back.
    if (typeof err?.message === "string" && /not configured|501/i.test(err.message)) return null;
    throw err;
  }
}
