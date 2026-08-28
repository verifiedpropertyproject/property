"use client";

import { useState } from "react";

export default function ResendVerificationButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError("");
    setVerifyUrl("");
    setEmailSent(false);

    try {
      const res = await fetch("/api/resend-verification", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to generate a link (status ${res.status}).`);
        return;
      }

      if (data.emailSent) {
        setEmailSent(true);
      } else {
        setVerifyUrl(data.verifyUrl);
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex w-fit items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Resend verification link"}
      </button>

      {error && (
        <p className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
          {error}
        </p>
      )}

      {emailSent && (
        <p className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-primary)]/30 bg-[var(--dk-success-bg)] px-3.5 py-2 text-sm text-[var(--dk-primary)]">
          A new verification email is on its way — check your inbox.
        </p>
      )}

      {verifyUrl && (
        <p className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-3.5 py-2 text-sm text-[var(--dk-ink)] break-words">
          Real email sending isn&apos;t configured, so here&apos;s your link directly:
          <br />
          <a href={verifyUrl} className="text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)] break-all">
            {verifyUrl}
          </a>
        </p>
      )}
    </div>
  );
}