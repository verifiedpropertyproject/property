import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { canRequestIdentityVerification } from "@/lib/identityVerification";
import { submitIdentityVerificationRequest } from "@/lib/identityVerificationRequest";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role !== "OWNER" && user.role !== "AGENT") {
      return NextResponse.json(
        { error: "Only seller accounts (as owner or agent) can request identity verification." },
        { status: 400 }
      );
    }

    if (!canRequestIdentityVerification(user.identityVerificationStatus)) {
      return NextResponse.json(
        { error: "You already have an identity verification request pending or approved." },
        { status: 400 }
      );
    }

    await submitIdentityVerificationRequest(user);

    return NextResponse.json({ identityVerificationStatus: "PENDING" });
  } catch (err) {
    return handleApiError(err);
  }
}
