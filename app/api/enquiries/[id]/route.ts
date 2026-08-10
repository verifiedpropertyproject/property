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
      return NextResponse.json({ error: "Only admins can approve or reject enquiries." }, { status: 403 });
    }

    const { status } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Status must be APPROVED or REJECTED." }, { status: 400 });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: params.id },
      include: { property: true, buyer: { select: { name: true, email: true } } },
    });

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    const updated = await prisma.enquiry.update({
      where: { id: params.id },
      data: { status },
    });

    if (status === "APPROVED") {
      // Only now does the seller actually see it
      await prisma.notification.create({
        data: {
          message: `${enquiry.buyer.name || enquiry.buyer.email} enquired about "${enquiry.property.title}": ${enquiry.message}`,
          senderId: session.user.id,
          receiverId: enquiry.property.sellerId,
          propertyId: enquiry.propertyId,
        },
      });
    } else {
      // Let the buyer know their enquiry wasn't approved
      await prisma.notification.create({
        data: {
          message: `Your enquiry about "${enquiry.property.title}" was not approved.`,
          senderId: session.user.id,
          receiverId: enquiry.buyerId,
          propertyId: enquiry.propertyId,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
