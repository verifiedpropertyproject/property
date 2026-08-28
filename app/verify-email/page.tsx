import Link from "next/link";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Same design system as forgot-password / reset-password: deep forest green,
// white card, plain CSS injected once so it renders regardless of the
// project's CSS tooling. Uses the same --dk-* design tokens (defined in
// app/globals.css) as the rest of the app, so this page follows light/dark
// mode instead of being stuck light-only. Class names (fpw-*) intentionally
// match the other token-link pages so the whole account flow feels continuous.
// ---------------------------------------------------------------------------
function VfyStyles() {
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

      .fpw-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 999px;
        margin-bottom: 16px;
      }
      .fpw-icon--success { background: var(--dk-success-bg); color: var(--dk-primary); }
      .fpw-icon--error { background: var(--dk-danger-bg); color: var(--dk-danger-ink); }

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
      .fpw-copy strong { color: var(--dk-ink); font-weight: 600; }

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

      .fpw-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-body);
        font-size: 0.92rem;
        font-weight: 600;
        color: #ffffff;
        background: var(--dk-primary);
        border: 1px solid var(--dk-primary);
        border-radius: 10px;
        padding: 11px 18px;
        cursor: pointer;
        text-decoration: none;
        transition: background-color 0.15s ease, border-color 0.15s ease;
        width: 100%;
        margin-top: 24px;
      }
      .fpw-button:hover { background: var(--dk-primary-hover); border-color: var(--dk-primary-hover); }

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
      <VfyStyles />
      <div className="fpw-card">{children}</div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <span className="fpw-icon fpw-icon--error">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 8v5m0 3.5h.01M10.3 3.9L1.8 18.1a1.8 1.8 0 001.55 2.7h17.3a1.8 1.8 0 001.55-2.7L13.7 3.9a1.8 1.8 0 00-3.4 0z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SuccessIcon() {
  return (
    <span className="fpw-icon fpw-icon--success">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 6l8 6 8-6M4 6h16v12H4V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;

  if (!token) {
    return (
      <CenteredCard>
        <ErrorIcon />
        <p className="fpw-eyebrow">Account verification</p>
        <h1 className="fpw-title">Verify your email</h1>
        <p className="fpw-alert fpw-alert--error">No verification token was provided.</p>
        <p className="fpw-footer">
          <Link href="/login" className="fpw-link">
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
        <ErrorIcon />
        <p className="fpw-eyebrow">Account verification</p>
        <h1 className="fpw-title">Verify your email</h1>
        <p className="fpw-alert fpw-alert--error">
          This verification link is invalid. It may have already been used.
        </p>
        <p className="fpw-copy">
          Log in and use the &quot;Resend verification link&quot; option on your dashboard to get a new one.
        </p>
        <Link href="/login" className="fpw-button">
          Log in
        </Link>
      </CenteredCard>
    );
  }

  if (record.expires < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });

    return (
      <CenteredCard>
        <ErrorIcon />
        <p className="fpw-eyebrow">Account verification</p>
        <h1 className="fpw-title">Verify your email</h1>
        <p className="fpw-alert fpw-alert--error">This verification link has expired.</p>
        <p className="fpw-copy">
          Log in and use the &quot;Resend verification link&quot; option on your dashboard to get a new one.
        </p>
        <Link href="/login" className="fpw-button">
          Log in
        </Link>
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
      <SuccessIcon />
      <p className="fpw-eyebrow">Account verification</p>
      <h1 className="fpw-title">Email verified</h1>
      <p className="fpw-copy">
        Your email address (<strong>{record.user.email}</strong>) has been verified.
      </p>
      <Link href="/login" className="fpw-button">
        Log in to continue
      </Link>
    </CenteredCard>
  );
}
