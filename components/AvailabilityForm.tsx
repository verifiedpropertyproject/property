"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
  { value: "RENTED", label: "Rented" },
];

// --- Color palette (matches Daktop360 admin lists) ---
const COLORS = {
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  dangerRed: "#DC2626",
  textDark: "#111827",
  border: "#E5E7EB",
  white: "#FFFFFF",
  disabledBg: "#F3F4F6",
};

export default function AvailabilityForm({
  propertyId,
  currentStatus,
}: {
  propertyId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (value === currentStatus) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityStatus: value }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update (status ${res.status}).`);
        return;
      }

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
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        .dk-avail-select:focus, .dk-avail-select:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }
        .dk-avail-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-avail-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-avail-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <select
        className="dk-avail-select"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
        style={{
          padding: "7px 10px",
          borderRadius: "6px",
          border: `1px solid ${COLORS.border}`,
          color: COLORS.textDark,
          fontSize: "13px",
          backgroundColor: loading ? COLORS.disabledBg : COLORS.white,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {AVAILABILITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="dk-avail-btn"
        disabled={loading || value === currentStatus}
        style={{
          backgroundColor: loading || value === currentStatus ? COLORS.disabledBg : COLORS.primaryGreen,
          color: loading || value === currentStatus ? "#9CA3AF" : COLORS.white,
          border: "none",
          borderRadius: "6px",
          padding: "7px 14px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading || value === currentStatus ? "not-allowed" : "pointer",
          transition: "background-color 0.2s ease, transform 0.15s ease",
        }}
      >
        {loading ? "Saving..." : "Update availability"}
      </button>

      {error && (
        <span style={{ color: COLORS.dangerRed, fontSize: "13px" }}>{error}</span>
      )}
    </form>
  );
}