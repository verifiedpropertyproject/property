import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ResetPasswordForm from "@/components/ResetPasswordForm";

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

        .dk-rp-link {
          color: ${COLORS.primaryGreen};
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .dk-rp-link:hover {
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
        }}
      >
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
        <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginTop: 0, marginBottom: "10px" }}>
          Reset your password
        </h1>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "16px" }}>
          No reset token was provided.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/forgot-password" className="dk-rp-link">
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
        <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginTop: 0, marginBottom: "10px" }}>
          Reset your password
        </h1>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "16px" }}>
          This reset link is invalid or has expired.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/forgot-password" className="dk-rp-link">
            Request a new reset link
          </Link>
        </p>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginTop: 0, marginBottom: "20px" }}>
        Reset your password
      </h1>
      <ResetPasswordForm token={token} />
    </CenteredCard>
  );
}
