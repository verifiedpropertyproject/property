import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { notifyUser, notifyUsers } from "@/lib/notify";
import { AVAILABILITY_STATUSES, getAvailabilityLabel, isClosedAvailability } from "@/lib/availabilityStatus";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { availabilityStatus } = await req.json();
    if (!AVAILABILITY_STATUSES.includes(availabilityStatus)) {
      return NextResponse.json(
        { error: "availabilityStatus must be AVAILABLE, RESERVED, SOLD, or RENTED." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const isOwner = property.sellerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the listing's own lister or an admin can change its availability." },
        { status: 403 }
      );
    }

    if (availabilityStatus === property.availabilityStatus) {
      return NextResponse.json(property);
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { availabilityStatus },
    });

    const label = getAvailabilityLabel(availabilityStatus);

    // Only notify if an admin made the change on someone else's behalf — no need to notify
    // yourself when you update your own listing.
    if (isAdmin && !isOwner) {
      await notifyUser({
        senderId: session.user.id,
        receiverId: property.sellerId,
        message: `An admin marked "${property.title}" as ${label}.`,
        propertyId: property.id,
        emailSubject: `Availability updated on your listing "${property.title}"`,
      });
    }

    // Let every buyer who saved this listing know it's changed, so the update reaches them
    // even though they aren't watching the listing page live.
    const savers = await prisma.savedProperty.findMany({
      where: { propertyId: property.id },
      select: { buyerId: true },
    });

    if (savers.length > 0) {
      const message = isClosedAvailability(availabilityStatus)
        ? `A property you saved, "${property.title}", is now marked ${label.toLowerCase()} and is no longer accepting enquiries.`
        : `A property you saved, "${property.title}", is now marked ${label.toLowerCase()}.`;

      await notifyUsers(
        savers.map((s: { buyerId: string }) => ({
          senderId: session.user.id,
          receiverId: s.buyerId,
          message,
          propertyId: property.id,
          emailSubject: `Availability updated on a listing you saved: "${property.title}"`,
        }))
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
