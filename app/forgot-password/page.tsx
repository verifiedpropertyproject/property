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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      * { box-sizing: border-box; }

      .fpw-page {
        min-height: 100vh;
        background: #F4F6F5;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #17251E;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .fpw-card {
        width: 100%;
        max-width: 420px;
        background: #FFFFFF;
        border: 1px solid #E7EBE8;
        border-radius: 16px;
        padding: 36px 32px;
        box-shadow: 0 1px 3px rgba(15,61,43,0.06);
      }

      .fpw-eyebrow {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6B7A72;
        margin: 0;
      }

      .fpw-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #14231F;
        margin: 6px 0 0;
        line-height: 1.25;
      }

      .fpw-copy {
        font-size: 0.9rem;
        line-height: 1.55;
        color: #566B60;
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
        color: #3E4A44;
      }

      .fpw-input {
        font-family: 'Inter', sans-serif;
        font-size: 0.92rem;
        color: #14231F;
        background: #FFFFFF;
        border: 1px solid #DAE1DD;
        border-radius: 10px;
        padding: 10px 14px;
        outline: none;
        width: 100%;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .fpw-input::placeholder { color: #9DA9A2; }
      .fpw-input:focus-visible {
        border-color: #17843C;
        box-shadow: 0 0 0 3px rgba(23,132,60,0.15);
      }

      .fpw-alert {
        margin: 0;
        font-size: 0.86rem;
        line-height: 1.5;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid transparent;
      }
      .fpw-alert--error { background: #FBE7E5; color: #C0392B; border-color: #F3CCC7; }
      .fpw-alert--success { background: #E4F5E9; color: #17843C; border-color: #C8E9D3; }
      .fpw-alert--info { background: #FCF0DC; color: #8A6A2E; border-color: #F2DDAE; }

      .fpw-reset-link {
        display: inline-block;
        margin-top: 6px;
        color: #8A6A2E;
        font-weight: 600;
        word-break: break-all;
        text-decoration: underline;
      }
      .fpw-reset-link:hover { color: #6B5220; }

      .fpw-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', sans-serif;
        font-size: 0.92rem;
        font-weight: 600;
        color: #FFFFFF;
        background: #123B2B;
        border: 1px solid #123B2B;
        border-radius: 10px;
        padding: 11px 18px;
        cursor: pointer;
        transition: background 0.15s ease;
        width: 100%;
      }
      .fpw-button:hover:not(:disabled) { background: #0D2B1F; }
      .fpw-button:disabled { opacity: 0.65; cursor: not-allowed; }
      .fpw-button:focus-visible {
        box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #17843C;
      }

      .fpw-footer {
        margin: 24px 0 0;
        text-align: center;
        font-size: 0.88rem;
      }
      .fpw-link {
        color: #17843C;
        font-weight: 600;
        text-decoration: none;
      }
      .fpw-link:hover { color: #0F5D2A; text-decoration: underline; }

      @media (prefers-reduced-motion: reduce) {
        * { transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}
