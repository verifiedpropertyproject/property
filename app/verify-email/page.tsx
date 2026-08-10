import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;

  if (!token) {
    return (
      <div>
        <h1>Verify your email</h1>
        <p>No verification token was provided.</p>
        <p>
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    );
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return (
      <div>
        <h1>Verify your email</h1>
        <p>This verification link is invalid. It may have already been used.</p>
        <p>
          Log in and use the "Resend verification link" option on your dashboard to get a new one.
        </p>
        <p>
          <Link href="/login">Log in</Link>
        </p>
      </div>
    );
  }

  if (record.expires < new Date()) {
    // Clean up the expired token
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });

    return (
      <div>
        <h1>Verify your email</h1>
        <p>This verification link has expired.</p>
        <p>
          Log in and use the "Resend verification link" option on your dashboard to get a new one.
        </p>
        <p>
          <Link href="/login">Log in</Link>
        </p>
      </div>
    );
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  // Token is single-use
  await prisma.emailVerificationToken.delete({ where: { id: record.id } });

  return (
    <div>
      <h1>Email verified</h1>
      <p>Your email address ({record.user.email}) has been verified.</p>
      <p>
        <Link href="/login">Log in to continue</Link>
      </p>
    </div>
  );
}
