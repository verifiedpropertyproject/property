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
      return NextResponse.json({ error: "Only admins can review identity verification requests." }, { status: 403 });
    }

    const { decision, note } = await req.json();
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return NextResponse.json({ error: "'decision' must be 'APPROVED' or 'REJECTED'." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.identityVerificationStatus !== "PENDING") {
      return NextResponse.json(
        { error: "This user doesn't have a pending identity verification request." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        identityVerificationStatus: decision,
        identityVerificationReviewedAt: new Date(),
        identityVerificationNote: typeof note === "string" && note.trim() ? note.trim() : null,
        // Approving the identity check also grants the account-level "Verified" badge.
        // Rejecting doesn't touch it either way — an admin can still hand-verify separately.
        ...(decision === "APPROVED" ? { verified: true } : {}),
      },
    });

    await notifyUser({
      senderId: session.user.id,
      receiverId: updated.id,
      message:
        decision === "APPROVED"
          ? "Your identity verification request was approved. Your account is now marked as Verified."
          : `Your identity verification request was not approved.${updated.identityVerificationNote ? ` Reason: ${updated.identityVerificationNote}` : ""}`,
      emailSubject:
        decision === "APPROVED" ? "Identity verification approved" : "Identity verification update",
    });

    return NextResponse.json({
      id: updated.id,
      identityVerificationStatus: updated.identityVerificationStatus,
      verified: updated.verified,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
