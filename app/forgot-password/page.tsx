"use client";

import { useState } from "react";
import Link from "next/link";

// --- Color palette (matches the Daktop360 reference design) ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  pageBg: "#FFFFFF",
  sectionBg: "#F7FAF8",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  dangerBg: "#FDECEC",
  dangerText: "#B42318",
};

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 500,
  fontSize: "13px",
  marginBottom: "6px",
  display: "block",
};

const fieldInputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  boxSizing: "border-box",
  fontSize: "14px",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

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

        .dk-fp-input:focus, .dk-fp-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }

        .dk-fp-btn {
          background-color: ${COLORS.primaryGreen};
          color: ${COLORS.white};
          border: none;
          border-radius: 8px;
          padding: 11px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        .dk-fp-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover};
          box-shadow: 0 4px 12px rgba(31,122,76,0.35);
        }
        .dk-fp-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .dk-fp-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .dk-fp-link {
          color: ${COLORS.primaryGreen};
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .dk-fp-link:hover {
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
        <h1
          style={{
            color: COLORS.darkGreen,
            fontSize: "22px",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          Forgot your password?
        </h1>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "24px", fontSize: "14px" }}>
          Enter your account email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "18px" }}>
            <label style={fieldLabelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="dk-fp-input"
              style={fieldInputStyle}
            />
          </div>

          {error && (
            <p
              style={{
                color: COLORS.dangerText,
                backgroundColor: COLORS.dangerBg,
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              style={{
                color: COLORS.primaryGreen,
                backgroundColor: COLORS.lightGreenBg,
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {message}
            </p>
          )}

          {resetUrl && (
            <p
              style={{
                color: COLORS.textGray,
                backgroundColor: COLORS.sectionBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                marginBottom: "16px",
                lineHeight: 1.6,
                overflowWrap: "break-word",
              }}
            >
              Real email sending isn&apos;t configured on this server, so here&apos;s your reset link
              directly (a fully configured version of this app would email it instead):
              <br />
              <a href={resetUrl} className="dk-fp-link" style={{ wordBreak: "break-all" }}>
                {resetUrl}
              </a>
            </p>
          )}

          <button type="submit" disabled={loading} className="dk-fp-btn">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p style={{ marginTop: "20px", marginBottom: 0, textAlign: "center", fontSize: "14px" }}>
          <Link href="/login" className="dk-fp-link">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
