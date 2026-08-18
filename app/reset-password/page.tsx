import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ResetPasswordForm from "@/components/ResetPasswordForm";

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>
        {children}
      </div>
    </div>
  );
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;

  if (!token) {
    return (
      <CenteredCard>
        <h1>
          Reset your password
        </h1>
        <p>
          No reset token was provided.
        </p>
        <p>
          <Link href="/forgot-password">
            Request a new reset link
          </Link>
        </p>
      </CenteredCard>
    );
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.expires < new Date()) {
    return (
      <CenteredCard>
        <h1>
          Reset your password
        </h1>
        <p>
          This reset link is invalid or has expired.
        </p>
        <p>
          <Link href="/forgot-password">
            Request a new reset link
          </Link>
        </p>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <h1>
        Reset your password
      </h1>
      <ResetPasswordForm token={token} />
    </CenteredCard>
  );
}