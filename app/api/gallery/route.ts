import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole } from "@/lib/roles";
import { saveGalleryImage } from "@/lib/galleryImageStorage";
import { IMAGE_MAX_SIZE_BYTES, ALLOWED_IMAGE_MIME_TYPES } from "@/lib/propertyConstants";
import { MAX_HOMEPAGE_GALLERY_IMAGES } from "@/lib/galleryConstants";

// Public — the homepage carousel reads this with no auth needed.
export async function GET() {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ images });
  } catch (err) {
    return handleApiError(err);
  }
}

// Admin-only — uploads one or more images, appended after whatever the current highest
// `order` value is so newly-added images show up last in the carousel by default.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const existingCount = await prisma.galleryImage.count();

    const formData = await req.formData();
    const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    const captionRaw = formData.get("caption");
    const caption = typeof captionRaw === "string" && captionRaw.trim() ? captionRaw.trim() : null;

    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one image to upload." }, { status: 400 });
    }

    if (existingCount + files.length > MAX_HOMEPAGE_GALLERY_IMAGES) {
      return NextResponse.json(
        {
          error: `The homepage gallery can have at most ${MAX_HOMEPAGE_GALLERY_IMAGES} images (it already has ${existingCount}).`,
        },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > IMAGE_MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Each image must be under ${IMAGE_MAX_SIZE_BYTES / (1024 * 1024)}MB.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Images must be JPEG, PNG, or WEBP files." }, { status: 400 });
      }
    }

    const maxOrderRow = await prisma.galleryImage.aggregate({ _max: { order: true } });
    let nextOrder = (maxOrderRow._max.order ?? -1) + 1;

    const urls = await Promise.all(files.map((file) => saveGalleryImage(file)));
    await prisma.galleryImage.createMany({
      data: urls.map((imageUrl) => ({
        imageUrl,
        caption,
        order: nextOrder++,
        uploadedById: session.user.id,
      })),
    });

    const images = await prisma.galleryImage.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ images }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
