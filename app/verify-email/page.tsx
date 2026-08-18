import Link from "next/link";
import { prisma } from "@/lib/prisma";

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>
        {children}
      </div>
    </div>
  );
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;

  if (!token) {
    return (
      <CenteredCard>
        <h1>
          Verify your email
        </h1>
        <p>
          No verification token was provided.
        </p>
        <p>
          <Link href="/login">
            Back to login
          </Link>
        </p>
      </CenteredCard>
    );
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return (
      <CenteredCard>
        <h1>
          Verify your email
        </h1>
        <p>
          This verification link is invalid. It may have already been used.
        </p>
        <p>
          Log in and use the &quot;Resend verification link&quot; option on your dashboard to get a new one.
        </p>
        <p>
          <Link href="/login">
            Log in
          </Link>
        </p>
      </CenteredCard>
    );
  }

  if (record.expires < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });

    return (
      <CenteredCard>
        <h1>
          Verify your email
        </h1>
        <p>
          This verification link has expired.
        </p>
        <p>
          Log in and use the &quot;Resend verification link&quot; option on your dashboard to get a new one.
        </p>
        <p>
          <Link href="/login">
            Log in
          </Link>
        </p>
      </CenteredCard>
    );
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  await prisma.emailVerificationToken.delete({ where: { id: record.id } });

  return (
    <CenteredCard>
      <h1>
        Email verified
      </h1>
      <p>
        Your email address ({record.user.email}) has been verified.
      </p>
      <p>
        <Link href="/login">
          Log in to continue
        </Link>
      </p>
    </CenteredCard>
  );
}