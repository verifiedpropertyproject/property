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
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Sending..." : "Resend verification link"}
      </button>

      {error && (
        <p>
          {error}
        </p>
      )}

      {emailSent && (
        <p>
          A new verification email is on its way — check your inbox.
        </p>
      )}

      {verifyUrl && (
        <p>
          Real email sending isn&apos;t configured, so here&apos;s your link directly:
          <br />
          <a href={verifyUrl}>
            {verifyUrl}
          </a>
        </p>
      )}
    </div>
  );
}