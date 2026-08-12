"use client";

import { useState } from "react";

// --- Color palette (matches Daktop360 admin components) ---
const COLORS = {
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  successGreen: "#15803D",
  successBg: "#F0FDF4",
  warnAmber: "#B45309",
  warnBg: "#FFFBEB",
  textDark: "#111827",
  border: "#E5E7EB",
  white: "#FFFFFF",
  disabledBg: "#F3F4F6",
};

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
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .dk-resend-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-resend-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-resend-btn:disabled {
          cursor: not-allowed;
        }
        .dk-resend-link {
          transition: color 0.2s ease;
        }
        .dk-resend-link:hover {
          color: ${COLORS.primaryGreenHover};
          text-decoration: underline;
        }
      `}</style>

      <button
        className="dk-resend-btn"
        onClick={handleClick}
        disabled={loading}
        style={{
          backgroundColor: loading ? COLORS.disabledBg : COLORS.primaryGreen,
          color: loading ? "#9CA3AF" : COLORS.white,
          border: "none",
          borderRadius: "8px",
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s ease, transform 0.15s ease",
        }}
      >
        {loading ? "Sending..." : "Resend verification link"}
      </button>

      {error && (
        <p
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.dangerRed,
            border: `1px solid ${COLORS.dangerRed}33`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            marginTop: "12px",
            maxWidth: "420px",
          }}
        >
          {error}
        </p>
      )}

      {emailSent && (
        <p
          style={{
            backgroundColor: COLORS.successBg,
            color: COLORS.successGreen,
            border: `1px solid ${COLORS.successGreen}33`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            marginTop: "12px",
            maxWidth: "420px",
          }}
        >
          A new verification email is on its way — check your inbox.
        </p>
      )}

      {verifyUrl && (
        <p
          style={{
            backgroundColor: COLORS.warnBg,
            color: COLORS.warnAmber,
            border: `1px solid ${COLORS.warnAmber}33`,
            borderRadius: "8px",
            padding: "10px 12px",
            fontSize: "13px",
            marginTop: "12px",
            maxWidth: "420px",
            wordBreak: "break-word",
          }}
        >
          Real email sending isn&apos;t configured, so here&apos;s your link directly:
          <br />
          <a href={verifyUrl} className="dk-resend-link" style={{ color: COLORS.warnAmber, fontWeight: 600 }}>
            {verifyUrl}
          </a>
        </p>
      )}
    </div>
  );
}