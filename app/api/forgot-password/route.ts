import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { issueResetLink } from "@/lib/passwordReset";

// Always returns the same generic message regardless of whether the email is
// registered, to avoid leaking which addresses have accounts (a real product
// concern even in an MVP). The one exception: when real email sending isn't
// configured, we include the reset link directly in the response so local
// testing works — this does leak existence in that fallback mode, which is
// fine for local development but should never ship to production as-is.
const GENERIC_MESSAGE = "If an account exists for that email, we've sent password reset instructions.";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // No account, or a Google-only account with no password to reset — say nothing more.
    if (!user || !user.password) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const { resetUrl, emailSent } = await issueResetLink(user.id, user.email);

    return NextResponse.json({
      message: GENERIC_MESSAGE,
      emailSent,
      resetUrl: emailSent ? undefined : resetUrl,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
