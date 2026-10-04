// Shared by the upload-token route (app/api/uploads/property/route.ts) and the listing routes
// that accept already-uploaded media as URLs. Everything a user uploads directly from the
// browser lives under their own folder, which is how the server knows a submitted URL is
// really theirs and not an arbitrary link.

export function userUploadPrefix(userId: string): string {
  return `properties/uploads/${userId}/`;
}

/** True only for a Vercel Blob public URL that sits inside this user's own upload folder. */
export function isOwnedUploadUrl(value: string, userId: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      decodeURIComponent(url.pathname).startsWith(`/${userUploadPrefix(userId)}`)
    );
  } catch {
    return false;
  }
}
