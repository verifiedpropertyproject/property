import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

const TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour — shorter than email verification, since this grants account access

/**
 * Creates a password reset token and tries to email it. If SMTP isn't
 * configured (or sending fails), `emailSent` is false and `resetUrl` is
 * returned so the caller can display it on screen — same MVP fallback as
 * email verification.
 */
export async function issueResetLink(userId: string, email: string) {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  const record = await prisma.passwordResetToken.create({
    data: {
      userId,
      expires: new Date(Date.now() + TOKEN_LIFETIME_MS),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${record.token}`;

  const result = await sendEmail({
    to: email,
    subject: "Reset your password",
    text: `Reset your password by visiting this link: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
  });

  return { token: record.token, resetUrl, emailSent: result.sent };
}
