import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";

// Marks all of the current user's unread notifications as read. Called when they open the
// notification bell's dropdown — deliberately "mark all" rather than per-item, since that's what
// the bell UI shows and keeps this route (and the client) simple.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { receiverId: session.user.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ marked: true });
  } catch (err) {
    return handleApiError(err);
  }
}
