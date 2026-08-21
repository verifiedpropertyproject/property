import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { readDocument, deleteDocument } from "@/lib/documentStorage";
import { recomputeDaktopVerified } from "@/lib/verificationStatus";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const doc = await prisma.propertyDocument.findUnique({
      where: { id: params.id },
      include: { property: { select: { id: true, sellerId: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const allowed = doc.property.sellerId === session.user.id || session.user.role === "ADMIN";
    if (!allowed) {
      return NextResponse.json({ error: "You don't have access to this document." }, { status: 403 });
    }

    const buffer = await readDocument(doc.property.id, doc.storedName);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
      },
    });
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

    const doc = await prisma.propertyDocument.findUnique({
      where: { id: params.id },
      include: { property: { select: { id: true, sellerId: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const allowed = doc.property.sellerId === session.user.id || session.user.role === "ADMIN";
    if (!allowed) {
      return NextResponse.json({ error: "You don't have access to this document." }, { status: 403 });
    }

    await prisma.propertyDocument.delete({ where: { id: doc.id } });

    // Best-effort storage cleanup — the DB row is the source of truth, so don't fail the
    // request just because the underlying file/blob was already missing.
    await deleteDocument(doc.property.id, doc.storedName);

    // Removing a document can flip the badge either way — recompute rather than assume.
    await recomputeDaktopVerified(doc.property.id);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
