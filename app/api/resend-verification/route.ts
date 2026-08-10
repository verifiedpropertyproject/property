import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { issueVerificationLink } from "@/lib/emailVerification";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json(
        { error: "Your session is out of date. Please log out and log back in." },
        { status: 401 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "This email is already verified." }, { status: 400 });
    }

    const { verifyUrl, emailSent } = await issueVerificationLink(user.id, user.email);

    return NextResponse.json({ emailSent, verifyUrl: emailSent ? undefined : verifyUrl });
  } catch (err) {
    return handleApiError(err);
  }
}
