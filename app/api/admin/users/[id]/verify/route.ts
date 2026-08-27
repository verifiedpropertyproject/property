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
      return NextResponse.json({ error: "Only admins can verify users." }, { status: 403 });
    }

    const { verified } = await req.json();
    if (typeof verified !== "boolean") {
      return NextResponse.json({ error: "'verified' must be true or false." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!["OWNER", "AGENT"].includes(targetUser.role || "")) {
      return NextResponse.json(
        { error: "Only seller accounts (as owner or agent) can be verified." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { verified },
    });

    await notifyUser({
      senderId: session.user.id,
      receiverId: updated.id,
      message: verified
        ? "Your account is now marked as Verified."
        : "Your account is no longer marked as Verified.",
      emailSubject: "Your account verification status changed",
    });

    return NextResponse.json({ id: updated.id, verified: updated.verified });
  } catch (err) {
    return handleApiError(err);
  }
}
