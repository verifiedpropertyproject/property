"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isValidPhone, PHONE_FORMAT_HINT, PHONE_INPUT_PATTERN } from "@/lib/phoneValidation";

// --- Color palette (matches Daktop360 admin components) ---
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

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 500,
  fontSize: "13px",
  display: "block",
  marginBottom: "6px",
};

export default function PhoneForm({ currentPhone }: { currentPhone: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(currentPhone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidPhone(phone)) {
      setError(PHONE_FORMAT_HINT);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to save (status ${res.status}).`);
        return;
      }

      setSuccess("Saved.");
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: COLORS.sectionBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        maxWidth: "360px",
      }}
    >
      <style>{`
        .dk-phone-input:focus, .dk-phone-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }
        .dk-phone-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-phone-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-phone-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <label style={fieldLabelStyle}>
        Phone number
        <input
          type="tel"
          className="dk-phone-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          pattern={PHONE_INPUT_PATTERN}
          placeholder="07XXXXXXXX or +2547XXXXXXXX"
          style={{
            marginTop: "2px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textDark,
            fontSize: "14px",
            width: "100%",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
        />
        <small style={{ display: "block", color: COLORS.textGray, fontSize: "12px", marginTop: "6px" }}>
          {PHONE_FORMAT_HINT}
        </small>
      </label>

      <button
        type="submit"
        className="dk-phone-btn"
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
          alignSelf: "flex-start",
          transition: "background-color 0.2s ease, transform 0.15s ease",
        }}
      >
        {loading ? "Saving..." : "Save"}
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
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          style={{
            backgroundColor: COLORS.successBg,
            color: COLORS.successGreen,
            border: `1px solid ${COLORS.successGreen}33`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            margin: 0,
          }}
        >
          {success}
        </p>
      )}
    </form>
  );
}