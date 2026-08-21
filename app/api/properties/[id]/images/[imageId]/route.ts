import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { deletePropertyImage } from "@/lib/propertyImageStorage";

const EDITABLE_STATUSES = ["PENDING", "CHANGES_REQUESTED", "REJECTED"];

export async function DELETE(req: Request, { params }: { params: { id: string; imageId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const image = await prisma.propertyImage.findUnique({
      where: { id: params.imageId },
      include: { property: { select: { id: true, sellerId: true, status: true } } },
    });

    if (!image || image.property.id !== params.id) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const isOwner = image.property.sellerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "You don't have access to this photo." }, { status: 403 });
    }

    if (isOwner && !isAdmin && !EDITABLE_STATUSES.includes(image.property.status)) {
      return NextResponse.json(
        { error: "This listing has already been approved and its photos can no longer be changed here." },
        { status: 400 }
      );
    }

    await prisma.propertyImage.delete({ where: { id: image.id } });

    // Best-effort storage cleanup — the DB row is the source of truth, so don't fail the
    // request just because the underlying file/blob was already missing.
    await deletePropertyImage(image.url);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
