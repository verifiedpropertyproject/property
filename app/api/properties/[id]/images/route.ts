import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { savePropertyImage } from "@/lib/propertyImageStorage";
import { IMAGE_MAX_SIZE_BYTES, ALLOWED_IMAGE_MIME_TYPES, MAX_GALLERY_IMAGES } from "@/lib/propertyConstants";

// Listings can't be edited once approved (see app/properties/[id]/edit/page.tsx), and the
// gallery is part of the listing content, so it follows the same rule.
const EDITABLE_STATUSES = ["PENDING", "CHANGES_REQUESTED", "REJECTED"];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: { _count: { select: { images: true } } },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (property.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only manage photos for your own listings." },
        { status: 403 }
      );
    }

    if (!EDITABLE_STATUSES.includes(property.status)) {
      return NextResponse.json(
        { error: "This listing has already been approved and its photos can no longer be changed here." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one photo to upload." }, { status: 400 });
    }

    if (property._count.images + files.length > MAX_GALLERY_IMAGES) {
      return NextResponse.json(
        {
          error: `A listing can have at most ${MAX_GALLERY_IMAGES} additional photos (this listing already has ${property._count.images}).`,
        },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > IMAGE_MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Each photo must be under ${IMAGE_MAX_SIZE_BYTES / (1024 * 1024)}MB.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Photos must be JPEG, PNG, or WEBP files." }, { status: 400 });
      }
    }

    const urls = await Promise.all(files.map((file) => savePropertyImage(file, property.id)));
    await prisma.propertyImage.createMany({
      data: urls.map((url) => ({ url, propertyId: property.id })),
    });

    const images = await prisma.propertyImage.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ images }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
