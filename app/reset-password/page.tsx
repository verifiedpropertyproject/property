import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ResetPasswordForm from "@/components/ResetPasswordForm";

// ---------------------------------------------------------------------------
// Same design system as forgot-password: deep forest green, white card, plain
// CSS injected once so it renders regardless of the project's CSS tooling.
// Uses the same --dk-* design tokens (defined in app/globals.css) as the rest
// of the app, so this page follows light/dark mode instead of being stuck
// light-only. Class names (fpw-*) intentionally match forgot-password/page.tsx
// so the two halves of the recovery flow look like one continuous experience.
// ---------------------------------------------------------------------------
function RpwStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }

      .fpw-page {
        min-height: 100vh;
        background: var(--dk-ivory);
        font-family: var(--font-body);
        color: var(--dk-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        transition: background-color 0.2s ease, color 0.2s ease;
      }

      .fpw-card {
        width: 100%;
        max-width: 420px;
        background: var(--dk-card);
        border: 1px solid var(--dk-border);
        border-radius: 16px;
        padding: 36px 32px;
        box-shadow: 0 1px 3px var(--dk-shadow);
        transition: background-color 0.2s ease, border-color 0.2s ease;
      }

      .fpw-eyebrow {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--dk-muted);
        margin: 0;
      }

      .fpw-title {
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--dk-heading);
        margin: 6px 0 0;
        line-height: 1.25;
      }

      .fpw-copy {
        font-size: 0.9rem;
        line-height: 1.55;
        color: var(--dk-muted);
        margin: 12px 0 0;
      }

      .fpw-alert {
        margin: 20px 0 0;
        font-size: 0.86rem;
        line-height: 1.5;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid transparent;
      }
      .fpw-alert--error {
        background: var(--dk-danger-bg);
        color: var(--dk-danger-ink);
        border-color: color-mix(in srgb, var(--dk-danger-ink) 35%, transparent);
      }

      .fpw-footer {
        margin: 24px 0 0;
        text-align: center;
        font-size: 0.88rem;
      }
      .fpw-link {
        color: var(--dk-primary);
        font-weight: 600;
        text-decoration: none;
      }
      .fpw-link:hover { color: var(--dk-primary-hover); text-decoration: underline; }

      @media (prefers-reduced-motion: reduce) {
        * { transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="fpw-page">
      <RpwStyles />
      <div className="fpw-card">{children}</div>
    </div>
  );
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;

  if (!token) {
    return (
      <CenteredCard>
        <p className="fpw-eyebrow">Account recovery</p>
        <h1 className="fpw-title">Reset your password</h1>
        <p className="fpw-alert fpw-alert--error">No reset token was provided.</p>
        <p className="fpw-footer">
          <Link href="/forgot-password" className="fpw-link">
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
        <p className="fpw-eyebrow">Account recovery</p>
        <h1 className="fpw-title">Reset your password</h1>
        <p className="fpw-alert fpw-alert--error">This reset link is invalid or has expired.</p>
        <p className="fpw-footer">
          <Link href="/forgot-password" className="fpw-link">
            Request a new reset link
          </Link>
        </p>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <p className="fpw-eyebrow">Account recovery</p>
      <h1 className="fpw-title">Reset your password</h1>
      <ResetPasswordForm token={token} />
    </CenteredCard>
  );
}
