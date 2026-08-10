import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a verification token and tries to email it. If SMTP isn't configured
 * (or sending fails), `emailSent` is false and `verifyUrl` is returned so the
 * caller can display it on screen instead — this is the MVP's dev-friendly
 * fallback so the flow always works even without real email set up.
 */
export async function issueVerificationLink(userId: string, email: string) {
  // Invalidate any previous unused tokens for this user
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const record = await prisma.emailVerificationToken.create({
    data: {
      userId,
      expires: new Date(Date.now() + TOKEN_LIFETIME_MS),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${record.token}`;

  const result = await sendEmail({
    to: email,
    subject: "Verify your email",
    text: `Verify your email by visiting this link: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  return { token: record.token, verifyUrl, emailSent: result.sent };
}

