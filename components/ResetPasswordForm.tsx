"use client";

import { useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Color palette (matches Daktop360 admin/auth components) ---
const COLORS = {
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  successGreen: "#15803D",
  successBg: "#F0FDF4",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  sectionBg: "#F7FAF8",
  white: "#FFFFFF",
  disabledBg: "#F3F4F6",
};

const fieldLabelStyle: CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 500,
  fontSize: "13px",
  display: "block",
  marginBottom: "6px",
};

const fieldInputStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  boxSizing: "border-box",
  fontSize: "14px",
  fontFamily: "inherit",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Something went wrong (status ${res.status}).`);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: COLORS.successBg,
          border: `1px solid ${COLORS.successGreen}33`,
          borderRadius: "12px",
          padding: "20px",
          maxWidth: "360px",
        }}
      >
        <style>{`
          .dk-reset-link { transition: color 0.2s ease; }
          .dk-reset-link:hover { color: ${COLORS.primaryGreenHover}; text-decoration: underline; }
        `}</style>
        <p style={{ color: COLORS.successGreen, fontWeight: 600, margin: "0 0 8px 0" }}>
          Your password has been reset.
        </p>
        <p style={{ margin: 0 }}>
          <Link
            href="/login"
            className="dk-reset-link"
            style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}
          >
            Log in with your new password
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: COLORS.sectionBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "14px",
        padding: "24px",
        maxWidth: "360px",
      }}
    >
      <style>{`
        .dk-reset-input:focus, .dk-reset-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }
        .dk-reset-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-reset-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-reset-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <div style={{ marginBottom: "16px" }}>
        <label style={fieldLabelStyle}>
          New password
          <input
            type="password"
            className="dk-reset-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ ...fieldInputStyle, marginTop: "2px" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={fieldLabelStyle}>
          Confirm new password
          <input
            type="password"
            className="dk-reset-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            style={{ ...fieldInputStyle, marginTop: "2px" }}
          />
        </label>
      </div>

      {error && (
        <p
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.dangerRed,
            border: `1px solid ${COLORS.dangerRed}33`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            margin: "0 0 16px 0",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className="dk-reset-btn"
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
          width: "100%",
          transition: "background-color 0.2s ease, transform 0.15s ease",
        }}
      >
        {loading ? "Saving..." : "Set new password"}
      </button>
    </form>
  );
}