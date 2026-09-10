import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isSuperAdminRole } from "@/lib/roles";
import { notifyUser } from "@/lib/notify";

// Pausing/resuming is intentionally a super-admin-only power (unlike every other property
// control in this app, which is open to any admin via isAdminRole) — it's a fast, blunt way
// to pull a live listing without going through delete or the review flow, so it's kept to the
// smaller trust tier the same way suspending/deleting another admin account is.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only a super admin can pause or resume a listing." }, { status: 403 });
    }

    const { paused } = await req.json();
    if (typeof paused !== "boolean") {
      return NextResponse.json({ error: "'paused' must be true or false." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { paused, pausedAt: paused ? new Date() : null },
    });

    await notifyUser({
      senderId: session.user.id,
      receiverId: property.sellerId,
      message: paused
        ? `Your listing "${property.title}" was paused by a super admin and is temporarily hidden from public view. It hasn't been deleted — it can be resumed at any time.`
        : `Your listing "${property.title}" was resumed and is publicly visible again.`,
      propertyId: property.id,
      emailSubject: paused ? `Your listing "${property.title}" was paused` : `Your listing "${property.title}" was resumed`,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
