"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// --- Color palette (matches Daktop360 admin lists) ---
const COLORS = {
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  border: "#E5E7EB",
  white: "#FFFFFF",
  disabledBg: "#F3F4F6",
};

export default function DeleteDocumentButton({ documentId, fileName }: { documentId: string; fileName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to delete (status ${res.status}).`);
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .dk-delete-doc-btn:hover:not(:disabled) {
          background-color: ${COLORS.dangerBg} !important;
        }
        .dk-delete-doc-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-delete-doc-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <button
        className="dk-delete-doc-btn"
        onClick={handleDelete}
        disabled={loading}
        style={{
          backgroundColor: loading ? COLORS.disabledBg : COLORS.white,
          color: loading ? "#9CA3AF" : COLORS.dangerRed,
          border: `1px solid ${loading ? COLORS.border : COLORS.dangerRed + "55"}`,
          borderRadius: "6px",
          padding: "7px 14px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s ease, transform 0.15s ease",
        }}
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <span style={{ color: COLORS.dangerRed, fontSize: "13px" }}>{error}</span>
      )}
    </span>
  );
}