import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can review properties." }, { status: 403 });
    }

    const { status, note } = await req.json();

    if (!["APPROVED", "REJECTED", "CHANGES_REQUESTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be APPROVED, REJECTED, or CHANGES_REQUESTED." },
        { status: 400 }
      );
    }

    if (status === "CHANGES_REQUESTED" && (!note || !note.trim())) {
      return NextResponse.json(
        { error: "A note explaining what needs to change is required." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data:
        status === "APPROVED"
          ? // Approving a listing marks it verified by default — an admin can still
            // flip that independently afterwards via the verify endpoint.
            { status, verified: true, adminNote: null }
          : status === "CHANGES_REQUESTED"
            ? { status, adminNote: note.trim() }
            : { status, adminNote: note ? note.trim() : null },
    });

    // Let the seller know the outcome
    const outcomeMessage =
      status === "APPROVED"
        ? `Your listing "${property.title}" was approved and is now live.`
        : status === "CHANGES_REQUESTED"
          ? `Changes were requested for your listing "${property.title}": ${note.trim()}`
          : `Your listing "${property.title}" was rejected.${note ? ` Reason: ${note.trim()}` : ""}`;

    await prisma.notification.create({
      data: {
        message: outcomeMessage,
        senderId: session.user.id,
        receiverId: property.sellerId,
        propertyId: property.id,
      },
    });

    return NextResponse.json(updated);
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete listings." }, { status: 403 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    // Let the seller know before the listing (and the notification's link to it) is gone
    await prisma.notification.create({
      data: {
        message: `Your listing "${property.title}" was removed by an admin.`,
        senderId: session.user.id,
        receiverId: property.sellerId,
      },
    });

    // Enquiries and saves for this property are removed automatically (onDelete: Cascade);
    // notifications that referenced it just lose the link (onDelete: SetNull) but keep their text.
    await prisma.property.delete({ where: { id: params.id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
