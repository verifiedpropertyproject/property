"use client";

import { useState } from "react";
import type { FormEvent } from "react";

// --- Color palette (matches Daktop360 admin components) ---
const COLORS = {
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  successGreen: "#15803D",
  successBg: "#F0FDF4",
  textDark: "#111827",
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

export default function EnquireForm({ propertyId }: { propertyId: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Enter a message first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/enquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to send enquiry (status ${res.status}).`);
        return;
      }

      setMessage("");
      setSuccess("Enquiry sent to the seller.");
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
        maxWidth: "480px",
      }}
    >
      <style>{`
        .dk-enquire-textarea:focus, .dk-enquire-textarea:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }
        .dk-enquire-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-enquire-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-enquire-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <div>
        <label style={fieldLabelStyle}>
          Ask the seller a question
          <textarea
            className="dk-enquire-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            required
            style={{
              marginTop: "2px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textDark,
              fontSize: "14px",
              width: "100%",
              boxSizing: "border-box",
              fontFamily: "inherit",
              resize: "vertical",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
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

      <button
        type="submit"
        className="dk-enquire-btn"
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
        {loading ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}