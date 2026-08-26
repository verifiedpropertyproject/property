import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { savePropertyVideo, deletePropertyVideo } from "@/lib/propertyImageStorage";
import { VIDEO_MAX_SIZE_BYTES, ALLOWED_VIDEO_MIME_TYPES } from "@/lib/propertyConstants";

// Listings can't be edited once approved (see app/properties/[id]/edit/page.tsx), and the
// video is part of the listing content, so it follows the same rule as photos.
const EDITABLE_STATUSES = ["PENDING", "CHANGES_REQUESTED", "REJECTED"];

async function loadOwnedEditableProperty(propertyId: string, userId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return { error: NextResponse.json({ error: "Property not found." }, { status: 404 }) };
  }
  if (property.sellerId !== userId) {
    return {
      error: NextResponse.json(
        { error: "You can only manage the video for your own listings." },
        { status: 403 }
      ),
    };
  }
  if (!EDITABLE_STATUSES.includes(property.status)) {
    return {
      error: NextResponse.json(
        { error: "This listing has already been approved and its video can no longer be changed here." },
        { status: 400 }
      ),
    };
  }
  return { property };
}

// Uploading a new video replaces any existing one for this listing — a listing has at most
// one walkthrough video, unlike the multi-photo gallery.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { property, error } = await loadOwnedEditableProperty(params.id, session.user.id);
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("video");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a video to upload." }, { status: 400 });
    }

    if (file.size > VIDEO_MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `The video must be under ${Math.round(VIDEO_MAX_SIZE_BYTES / (1024 * 1024))}MB.` },
        { status: 400 }
      );
    }
    if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Videos must be MP4, WebM, or MOV files." }, { status: 400 });
    }

    const newUrl = await savePropertyVideo(file, property!.id);

    // Best-effort cleanup of the old video, if any — never block the new one on it.
    if (property!.videoUrl) {
      await deletePropertyVideo(property!.videoUrl).catch(() => {});
    }

    const updated = await prisma.property.update({
      where: { id: property!.id },
      data: { videoUrl: newUrl },
      select: { videoUrl: true },
    });

    return NextResponse.json({ videoUrl: updated.videoUrl }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { property, error } = await loadOwnedEditableProperty(params.id, session.user.id);
    if (error) return error;

    if (property!.videoUrl) {
      await deletePropertyVideo(property!.videoUrl).catch(() => {});
    }

    await prisma.property.update({ where: { id: property!.id }, data: { videoUrl: null } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
