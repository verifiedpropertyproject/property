"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PendingEnquiry = {
  id: string;
  message: string;
  property: { id: string; title: string };
  buyer: { name: string | null; email: string };
};

// --- Color palette (matches Daktop360 admin components) ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  sectionBg: "#F7FAF8",
  white: "#FFFFFF",
  disabledBg: "#F3F4F6",
};

export default function EnquiryApprovalList({ enquiries }: { enquiries: PendingEnquiry[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDecision(id: string, status: "APPROVED" | "REJECTED") {
    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update enquiry (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (enquiries.length === 0) {
    return (
      <p style={{ color: COLORS.textGray, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        No enquiries waiting for review.
      </p>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: COLORS.textDark }}>
      <style>{`
        .dk-enq-card {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dk-enq-card:hover {
          box-shadow: 0 4px 14px rgba(11,46,31,0.08);
          border-color: ${COLORS.primaryGreen}55;
        }
        .dk-enq-link {
          transition: color 0.2s ease;
        }
        .dk-enq-link:hover {
          color: ${COLORS.primaryGreenHover};
          text-decoration: underline;
        }
        .dk-enq-btn-approve:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-enq-btn-reject:hover:not(:disabled) {
          background-color: ${COLORS.dangerBg} !important;
        }
        .dk-enq-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-enq-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      {error && (
        <p
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.dangerRed,
            border: `1px solid ${COLORS.dangerRed}33`,
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          {error}
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        {enquiries.map((e) => (
          <li
            key={e.id}
            className="dk-enq-card"
            style={{
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: COLORS.textGray, fontSize: "13px" }}>Re: </span>
              <Link href={`/properties/${e.property.id}`} className="dk-enq-link" style={{ textDecoration: "none" }}>
                <strong style={{ color: COLORS.textDark, fontSize: "15px" }}>{e.property.title}</strong>
              </Link>
            </div>

            <div
              style={{
                backgroundColor: COLORS.sectionBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "14px",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: COLORS.textGray }}>From {e.buyer.name || e.buyer.email}:</span>{" "}
              <span style={{ color: COLORS.textDark }}>{e.message}</span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="dk-enq-btn dk-enq-btn-approve"
                disabled={loadingId === e.id}
                onClick={() => handleDecision(e.id, "APPROVED")}
                style={{
                  backgroundColor: loadingId === e.id ? COLORS.disabledBg : COLORS.primaryGreen,
                  color: loadingId === e.id ? "#9CA3AF" : COLORS.white,
                  border: "none",
                  borderRadius: "6px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loadingId === e.id ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
              >
                {loadingId === e.id ? "Working..." : "Approve"}
              </button>

              <button
                className="dk-enq-btn dk-enq-btn-reject"
                disabled={loadingId === e.id}
                onClick={() => handleDecision(e.id, "REJECTED")}
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.dangerRed,
                  border: `1px solid ${COLORS.dangerRed}55`,
                  borderRadius: "6px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loadingId === e.id ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
              >
                {loadingId === e.id ? "Working..." : "Reject"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}