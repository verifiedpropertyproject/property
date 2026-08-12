"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPropertyTypeLabel } from "@/lib/propertyConstants";

type PendingProperty = {
  id: string;
  title: string;
  description: string;
  location: string;
  propertyType: string;
  propertyTypeOther: string | null;
  listingType: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  acreage: number | null;
  representingName: string | null;
  representingContact: string | null;
  seller: { name: string | null; email: string; role: string | null; verified: boolean };
};

// --- Color palette (matches Daktop360 admin components) ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  warnAmber: "#B45309",
  warnBg: "#FFFBEB",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  sectionBg: "#F7FAF8",
  white: "#FFFFFF",
  disabledBg: "#F3F4F6",
};

export default function PropertyApprovalList({ properties }: { properties: PendingProperty[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDecision(id: string, status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED", note?: string) {
    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update listing (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  function handleRequestChanges(id: string, title: string) {
    const note = window.prompt(`What needs to change on "${title}" before it can be approved?`);
    if (!note || !note.trim()) return;
    handleDecision(id, "CHANGES_REQUESTED", note.trim());
  }

  if (properties.length === 0) {
    return (
      <p style={{ color: COLORS.textGray, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        No listings waiting for review.
      </p>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: COLORS.textDark }}>
      <style>{`
        .dk-pending-card {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dk-pending-card:hover {
          box-shadow: 0 4px 14px rgba(11,46,31,0.08);
          border-color: ${COLORS.primaryGreen}55;
        }
        .dk-pending-link {
          transition: color 0.2s ease;
        }
        .dk-pending-link:hover {
          color: ${COLORS.primaryGreenHover};
          text-decoration: underline;
        }
        .dk-pending-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-pending-btn:disabled {
          cursor: not-allowed;
        }
        .dk-pending-btn-approve:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-pending-btn-changes:hover:not(:disabled) {
          background-color: ${COLORS.warnBg} !important;
        }
        .dk-pending-btn-reject:hover:not(:disabled) {
          background-color: ${COLORS.dangerBg} !important;
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
        {properties.map((p) => (
          <li
            key={p.id}
            className="dk-pending-card"
            style={{
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            {/* Title + type/listing/price */}
            <div style={{ marginBottom: "6px" }}>
              <strong style={{ color: COLORS.textDark, fontSize: "16px" }}>{p.title}</strong>{" "}
              <span style={{ color: COLORS.textGray, fontSize: "13px" }}>
                — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} — {p.listingType}
              </span>{" "}
              <span style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "15px" }}>
                KSh {p.price.toLocaleString()}
              </span>
            </div>

            {/* Location + specs */}
            <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "10px" }}>
              {p.location}
              {p.bedrooms !== null && <> — {p.bedrooms} bed</>}
              {p.bathrooms !== null && <> — {p.bathrooms} bath</>}
              {p.acreage !== null && <> — {p.acreage} acres</>}
            </div>

            {/* Description */}
            <div
              style={{
                backgroundColor: COLORS.sectionBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "10px",
                fontSize: "14px",
                lineHeight: 1.5,
                color: COLORS.textDark,
              }}
            >
              {p.description}
            </div>

            {/* Seller info */}
            <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "4px" }}>
              Listed by {p.seller.name || p.seller.email} ({p.seller.role === "AGENT" ? "Agent" : "Property Owner"})
              {p.seller.verified && <span style={{ color: COLORS.primaryGreen }}> — Verified account</span>}
            </div>

            {/* Representing */}
            {p.representingName && (
              <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "4px" }}>
                Representing: {p.representingName}
                {p.representingContact && <> ({p.representingContact})</>}
              </div>
            )}

            <Link
              href={`/properties/${p.id}/documents`}
              className="dk-pending-link"
              style={{ color: COLORS.primaryGreen, fontWeight: 500, fontSize: "13px", textDecoration: "none" }}
            >
              View supporting documents
            </Link>

            {/* Action buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
              <button
                className="dk-pending-btn dk-pending-btn-approve"
                disabled={loadingId === p.id}
                onClick={() => handleDecision(p.id, "APPROVED")}
                style={{
                  backgroundColor: loadingId === p.id ? COLORS.disabledBg : COLORS.primaryGreen,
                  color: loadingId === p.id ? "#9CA3AF" : COLORS.white,
                  border: "none",
                  borderRadius: "6px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loadingId === p.id ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
              >
                {loadingId === p.id ? "Working..." : "Approve"}
              </button>

              <button
                className="dk-pending-btn dk-pending-btn-changes"
                disabled={loadingId === p.id}
                onClick={() => handleRequestChanges(p.id, p.title)}
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.warnAmber,
                  border: `1px solid ${COLORS.warnAmber}55`,
                  borderRadius: "6px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loadingId === p.id ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
              >
                {loadingId === p.id ? "Working..." : "Request changes"}
              </button>

              <button
                className="dk-pending-btn dk-pending-btn-reject"
                disabled={loadingId === p.id}
                onClick={() => handleDecision(p.id, "REJECTED")}
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.dangerRed,
                  border: `1px solid ${COLORS.dangerRed}55`,
                  borderRadius: "6px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loadingId === p.id ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
              >
                {loadingId === p.id ? "Working..." : "Reject"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}