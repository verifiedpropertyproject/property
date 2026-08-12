"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// --- Color palette (matches Daktop360 homepage) ---
const COLORS = {
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  border: "#E5E7EB",
  white: "#FFFFFF",
  disabledBg: "#F3F4F6",
};

export default function SaveButton({ propertyId, initiallySaved }: { propertyId: string; initiallySaved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/properties/${propertyId}/save`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update (status ${res.status}).`);
        return;
      }

      setSaved(data.saved);
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .dk-save-btn-off:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-save-btn-on:hover:not(:disabled) {
          background-color: ${COLORS.dangerBg} !important;
          border-color: ${COLORS.dangerRed} !important;
          color: ${COLORS.dangerRed} !important;
        }
        .dk-save-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-save-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <button
        className={`dk-save-btn ${saved ? "dk-save-btn-on" : "dk-save-btn-off"}`}
        onClick={toggle}
        disabled={loading}
        style={
          saved
            ? {
                backgroundColor: loading ? COLORS.disabledBg : COLORS.lightGreenBg,
                color: loading ? "#9CA3AF" : COLORS.primaryGreen,
                border: `1px solid ${COLORS.primaryGreen}55`,
                borderRadius: "8px",
                padding: "9px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                width: "100%",
                transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease",
              }
            : {
                backgroundColor: loading ? COLORS.disabledBg : COLORS.primaryGreen,
                color: loading ? "#9CA3AF" : COLORS.white,
                border: "none",
                borderRadius: "8px",
                padding: "9px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                width: "100%",
                transition: "background-color 0.2s ease, transform 0.15s ease",
              }
        }
      >
        {loading ? "Working..." : saved ? "Unsave property" : "Save property"}
      </button>

      {error && (
        <p
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.dangerRed,
            border: `1px solid ${COLORS.dangerRed}33`,
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "12px",
            marginTop: "8px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}