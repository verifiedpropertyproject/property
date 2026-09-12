import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole } from "@/lib/roles";
import { deleteGalleryImage } from "@/lib/galleryImageStorage";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const image = await prisma.galleryImage.findUnique({ where: { id: params.id } });
    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    await prisma.galleryImage.delete({ where: { id: image.id } });

    // Best-effort storage cleanup — the DB row is the source of truth, so don't fail the
    // request just because the underlying file/blob was already missing.
    await deleteGalleryImage(image.imageUrl);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

// Reorders one image relative to its neighbor: { direction: "up" | "down" }. Swaps `order`
// with whichever image currently sits on that side, so moving repeatedly walks it through the
// list one step at a time — no drag-and-drop UI needed for a handful of homepage images.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const direction = body?.direction;
    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "direction must be \"up\" or \"down\"." }, { status: 400 });
    }

    const current = await prisma.galleryImage.findUnique({ where: { id: params.id } });
    if (!current) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    const neighbor = await prisma.galleryImage.findFirst({
      where:
        direction === "up"
          ? { order: { lt: current.order } }
          : { order: { gt: current.order } },
      orderBy: { order: direction === "up" ? "desc" : "asc" },
    });

    if (!neighbor) {
      // Already first/last — nothing to swap with, not an error.
      const images = await prisma.galleryImage.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      return NextResponse.json({ images });
    }

    await prisma.$transaction([
      prisma.galleryImage.update({ where: { id: current.id }, data: { order: neighbor.order } }),
      prisma.galleryImage.update({ where: { id: neighbor.id }, data: { order: current.order } }),
    ]);

    const images = await prisma.galleryImage.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ images });
  } catch (err) {
    return handleApiError(err);
  }
}
