import Link from "next/link";
import { prisma } from "@/lib/prisma";

// --- Color palette (matches the Daktop360 reference design) ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  pageBg: "#FFFFFF",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: COLORS.pageBg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }

        .dk-ve-link {
          color: ${COLORS.primaryGreen};
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .dk-ve-link:hover {
          color: ${COLORS.primaryGreenHover};
          text-decoration: underline;
        }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "14px",
          padding: "clamp(24px, 4vw, 32px)",
          textAlign: "center",
        }}
      >
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
        <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginTop: 0, marginBottom: "10px" }}>
          Verify your email
        </h1>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "16px" }}>
          No verification token was provided.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/login" className="dk-ve-link">
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
        <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginTop: 0, marginBottom: "10px" }}>
          Verify your email
        </h1>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "10px" }}>
          This verification link is invalid. It may have already been used.
        </p>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "16px" }}>
          Log in and use the &quot;Resend verification link&quot; option on your dashboard to get a new one.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/login" className="dk-ve-link">
            Log in
          </Link>
        </p>
      </CenteredCard>
    );
  }

  if (record.expires < new Date()) {
    // Clean up the expired token
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });

    return (
      <CenteredCard>
        <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginTop: 0, marginBottom: "10px" }}>
          Verify your email
        </h1>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "10px" }}>
          This verification link has expired.
        </p>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "16px" }}>
          Log in and use the &quot;Resend verification link&quot; option on your dashboard to get a new one.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/login" className="dk-ve-link">
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

  // Token is single-use
  await prisma.emailVerificationToken.delete({ where: { id: record.id } });

  return (
    <CenteredCard>
      <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginTop: 0, marginBottom: "10px" }}>
        Email verified
      </h1>
      <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "16px" }}>
        Your email address ({record.user.email}) has been verified.
      </p>
      <p style={{ margin: 0 }}>
        <Link href="/login" className="dk-ve-link">
          Log in to continue
        </Link>
      </p>
    </CenteredCard>
  );
}
