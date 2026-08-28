"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Something went wrong (status ${res.status}).`);
        return;
      }

      setMessage(data.message);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fpw-page">
      <FpwStyles />
      <div className="fpw-card">
        <p className="fpw-eyebrow">Account recovery</p>
        <h1 className="fpw-title">Forgot your password?</h1>
        <p className="fpw-copy">
          Enter your account email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="fpw-form">
          <div className="fpw-field">
            <label className="fpw-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="fpw-input"
            />
          </div>

          {error && <p className="fpw-alert fpw-alert--error">{error}</p>}

          {message && <p className="fpw-alert fpw-alert--success">{message}</p>}

          {resetUrl && (
            <p className="fpw-alert fpw-alert--info">
              Real email sending isn&apos;t configured on this server, so here&apos;s your reset
              link directly (a fully configured version of this app would email it instead):
              <br />
              <a href={resetUrl} className="fpw-reset-link">
                {resetUrl}
              </a>
            </p>
          )}

          <button type="submit" disabled={loading} className="fpw-button">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="fpw-footer">
          <Link href="/login" className="fpw-link">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Same design system as the dashboard: deep forest green, white card, plain
// CSS injected once so it renders regardless of the project's CSS tooling.
// ---------------------------------------------------------------------------
function FpwStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }

      /* Uses the same --dk-* design tokens (defined in app/globals.css) as the rest of
         the app, so this page follows light/dark mode instead of being stuck light-only. */

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

      .fpw-form {
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .fpw-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .fpw-label {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--dk-ink);
      }

      .fpw-input {
        font-family: var(--font-body);
        font-size: 0.92rem;
        color: var(--dk-ink);
        background: var(--dk-card);
        border: 1px solid var(--dk-border);
        border-radius: 10px;
        padding: 10px 14px;
        outline: none;
        width: 100%;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease;
      }
      .fpw-input::placeholder { color: var(--dk-muted); }
      .fpw-input:focus-visible {
        border-color: var(--dk-primary);
        box-shadow: 0 0 0 3px var(--dk-primary-ring);
      }

      .fpw-alert {
        margin: 0;
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
      .fpw-alert--success {
        background: var(--dk-success-bg);
        color: var(--dk-primary);
        border-color: color-mix(in srgb, var(--dk-primary) 35%, transparent);
      }
      .fpw-alert--info {
        background: var(--dk-gold-bg);
        color: var(--dk-gold-deep);
        border-color: var(--dk-gold);
      }

      .fpw-reset-link {
        display: inline-block;
        margin-top: 6px;
        color: var(--dk-gold-deep);
        font-weight: 600;
        word-break: break-all;
        text-decoration: underline;
      }
      .fpw-reset-link:hover { color: var(--dk-gold); }

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
        transition: background-color 0.15s ease, border-color 0.15s ease;
        width: 100%;
      }
      .fpw-button:hover:not(:disabled) { background: var(--dk-primary-hover); border-color: var(--dk-primary-hover); }
      .fpw-button:disabled { opacity: 0.65; cursor: not-allowed; }
      .fpw-button:focus-visible {
        box-shadow: 0 0 0 2px var(--dk-card), 0 0 0 4px var(--dk-primary);
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
