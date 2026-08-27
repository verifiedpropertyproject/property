import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { notifyUser } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can approve or reject viewing requests." },
        { status: 403 }
      );
    }

    const { status } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Status must be APPROVED or REJECTED." }, { status: 400 });
    }

    const viewingRequest = await prisma.viewingRequest.findUnique({
      where: { id: params.id },
      include: { property: true, buyer: { select: { name: true, email: true } } },
    });

    if (!viewingRequest) {
      return NextResponse.json({ error: "Viewing request not found." }, { status: 404 });
    }

    const updated = await prisma.viewingRequest.update({
      where: { id: params.id },
      data: { status },
    });

    const formattedDate = viewingRequest.preferredDate.toLocaleString();

    if (status === "APPROVED") {
      // Only now does the seller actually see it, same as an approved enquiry.
      await notifyUser({
        senderId: session.user.id,
        receiverId: viewingRequest.property.sellerId,
        message: `${viewingRequest.buyer.name || viewingRequest.buyer.email} requested to view "${viewingRequest.property.title}" on ${formattedDate}.`,
        propertyId: viewingRequest.propertyId,
        emailSubject: `New viewing request for "${viewingRequest.property.title}"`,
      });
    } else {
      // Let the buyer know their request wasn't approved.
      await notifyUser({
        senderId: session.user.id,
        receiverId: viewingRequest.buyerId,
        message: `Your viewing request for "${viewingRequest.property.title}" was not approved.`,
        propertyId: viewingRequest.propertyId,
        emailSubject: `Update on your viewing request for "${viewingRequest.property.title}"`,
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
