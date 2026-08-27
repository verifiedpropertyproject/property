import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { notifyUsers } from "@/lib/notify";
import { isClosedAvailability } from "@/lib/availabilityStatus";
import type { User } from "@prisma/client";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (session.user.role !== "BUYER") {
      return NextResponse.json({ error: "Only buyers can request viewings." }, { status: 403 });
    }

    const { preferredDate, message } = await req.json();

    if (!preferredDate) {
      return NextResponse.json({ error: "Preferred viewing date is required." }, { status: 400 });
    }

    const parsedDate = new Date(preferredDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Preferred viewing date is invalid." }, { status: 400 });
    }

    if (parsedDate.getTime() < Date.now()) {
      return NextResponse.json({ error: "Preferred viewing date must be in the future." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });

    if (!property || property.status !== "APPROVED") {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (isClosedAvailability(property.availabilityStatus)) {
      return NextResponse.json(
        { error: "This property is no longer accepting viewing requests." },
        { status: 400 }
      );
    }

    const viewingRequest = await prisma.viewingRequest.create({
      data: {
        preferredDate: parsedDate,
        message: message?.trim() ? message.trim() : null,
        status: "PENDING",
        propertyId: property.id,
        buyerId: session.user.id,
      },
    });

    // Same moderation pattern as enquiries — the seller isn't notified until an admin
    // approves the request.
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });

    if (admins.length > 0) {
      await notifyUsers(
        admins.map((admin: User) => ({
          senderId: session.user.id,
          receiverId: admin.id,
          message: `${session.user.name || session.user.email} requested a viewing of "${property.title}" that needs review.`,
          propertyId: property.id,
          emailSubject: "New viewing request needs review",
        }))
      );
    }

    return NextResponse.json(viewingRequest, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
