import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole } from "@/lib/roles";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  IMAGE_MAX_SIZE_BYTES,
  VIDEO_MAX_SIZE_BYTES,
} from "@/lib/propertyConstants";
import { userUploadPrefix } from "@/lib/propertyUploadUrls";

// Vercel serverless functions reject request bodies over ~4.5MB (HTTP 413), which a listing's
// photos + video easily exceed. So the browser uploads each file straight to Vercel Blob
// instead, and this route only hands out a short-lived token for that. It never sees the file.
// The token is locked to this user's own folder, to image/video types, and to the size limits.
// The listing request afterwards carries just the resulting URLs (see lib/propertyUploadUrls.ts).
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const role = session.user.role || "";
    if (!["OWNER", "AGENT"].includes(role) && !isAdminRole(role)) {
      return NextResponse.json(
        { error: "Only property owners, agents, and admins can upload listing media." },
        { status: 403 }
      );
    }

    const token = process.env.PROPERTY_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      // Local dev without Blob: the form falls back to the old direct upload (no size cap
      // locally), so this is a normal, expected answer rather than an error.
      return NextResponse.json({ error: "Blob storage is not configured.", blobConfigured: false }, { status: 501 });
    }

    const body = (await req.json()) as HandleUploadBody;
    const prefix = userUploadPrefix(session.user.id);

    const result = await handleUpload({
      token,
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(prefix)) {
          throw new Error("Invalid upload path.");
        }
        const isVideo = /\.(mp4|webm|mov)$/i.test(pathname);
        return {
          allowedContentTypes: isVideo ? ALLOWED_VIDEO_MIME_TYPES : ALLOWED_IMAGE_MIME_TYPES,
          maximumSizeInBytes: isVideo ? VIDEO_MAX_SIZE_BYTES : IMAGE_MAX_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
