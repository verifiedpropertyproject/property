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
      return NextResponse.json({ error: "Only buyers can send enquiries." }, { status: 403 });
    }

    const { message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });

    if (!property || property.status !== "APPROVED") {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (isClosedAvailability(property.availabilityStatus)) {
      return NextResponse.json(
        { error: "This property is no longer accepting enquiries." },
        { status: 400 }
      );
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        message,
        status: "PENDING",
        propertyId: property.id,
        buyerId: session.user.id,
      },
    });

    // The seller isn't notified yet — an admin has to approve the enquiry first.
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });

    if (admins.length > 0) {
      await notifyUsers(
        admins.map((admin: User) => ({
          senderId: session.user.id,
          receiverId: admin.id,
          message: `${session.user.name || session.user.email} sent an enquiry about "${property.title}" that needs review.`,
          propertyId: property.id,
          emailSubject: "New enquiry needs review",
        }))
      );
    }

    return NextResponse.json(enquiry, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
