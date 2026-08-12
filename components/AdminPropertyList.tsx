"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvailabilityForm from "@/components/AvailabilityForm";

type ManagedProperty = {
  id: string;
  title: string;
  status: string;
  adminNote: string | null;
  verified: boolean;
  featured: boolean;
  showContact: boolean;
  availabilityStatus: string;
  price: number;
  views: number;
  representingName: string | null;
  seller: { name: string | null; email: string; phone: string | null; role: string | null; verified: boolean };
  _count: { savedBy: number };
};

// --- Color palette (matches Daktop360 homepage) ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  dangerRed: "#DC2626",
  dangerRedHover: "#B91C1C",
  dangerBg: "#FEF2F2",
  pageBg: "#FFFFFF",
  sectionBg: "#F7FAF8",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

export default function AdminPropertyList({ properties }: { properties: ManagedProperty[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleVerified(id: string, current: boolean) {
    await runAction(id, `/api/properties/${id}/verify`, { verified: !current });
  }

  async function toggleFeatured(id: string, current: boolean) {
    await runAction(id, `/api/properties/${id}/feature`, { featured: !current });
  }

  async function toggleShowContact(id: string, current: boolean) {
    await runAction(id, `/api/properties/${id}/show-contact`, { showContact: !current });
  }

  async function runAction(id: string, url: string, body: object) {
    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to delete listing (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (properties.length === 0) {
    return (
      <p style={{ color: COLORS.textGray, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        No listings yet.
      </p>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: COLORS.textDark }}>
      <style>{`
        .dk-admin-card {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dk-admin-card:hover {
          box-shadow: 0 4px 14px rgba(11,46,31,0.08);
          border-color: ${COLORS.primaryGreen}55;
        }
        .dk-admin-link {
          transition: color 0.2s ease;
        }
        .dk-admin-link:hover {
          color: ${COLORS.primaryGreenHover};
          text-decoration: underline;
        }
        .dk-admin-btn {
          transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, transform 0.15s ease;
        }
        .dk-admin-btn:hover:not(:disabled) {
          background-color: ${COLORS.lightGreenBg};
          border-color: ${COLORS.primaryGreen};
        }
        .dk-admin-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-admin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .dk-admin-btn-delete:hover:not(:disabled) {
          background-color: ${COLORS.dangerBg} !important;
          border-color: ${COLORS.dangerRed} !important;
          color: ${COLORS.dangerRed} !important;
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
            className="dk-admin-card"
            style={{
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            {/* Title + price */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
              <Link href={`/properties/${p.id}`} className="dk-admin-link" style={{ textDecoration: "none" }}>
                <strong style={{ color: COLORS.textDark, fontSize: "16px" }}>{p.title}</strong>
              </Link>
              <span style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "15px" }}>
                KSh {p.price.toLocaleString()}
              </span>
            </div>

            {/* Status / tag badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
              <span
                style={{
                  backgroundColor: COLORS.sectionBg,
                  color: COLORS.textGray,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "4px",
                }}
              >
                Status: {p.status}
              </span>
              <span
                style={{
                  backgroundColor: p.verified ? COLORS.lightGreenBg : COLORS.sectionBg,
                  color: p.verified ? COLORS.primaryGreen : COLORS.textGray,
                  border: `1px solid ${p.verified ? COLORS.primaryGreen + "33" : COLORS.border}`,
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                }}
              >
                {p.verified ? "Verified" : "Not Verified"}
              </span>
              {p.featured && (
                <span
                  style={{
                    backgroundColor: COLORS.darkGreen,
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    letterSpacing: "0.02em",
                  }}
                >
                  FEATURED
                </span>
              )}
              <span
                style={{
                  backgroundColor: COLORS.sectionBg,
                  color: COLORS.textGray,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "4px",
                }}
              >
                Contact {p.showContact ? "shown publicly" : "hidden from public"}
              </span>
            </div>

            {/* Availability form */}
            <div style={{ marginBottom: "10px" }}>
              <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
            </div>

            {/* Views / saved */}
            <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "8px" }}>
              {p.views} views — {p._count.savedBy} saved
            </div>

            {/* Admin note */}
            {p.adminNote && (
              <div
                style={{
                  color: COLORS.textDark,
                  backgroundColor: COLORS.sectionBg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontStyle: "italic",
                  marginBottom: "10px",
                }}
              >
                Admin note: {p.adminNote}
              </div>
            )}

            {/* Seller info */}
            <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "4px", overflowWrap: "break-word" }}>
              Listed by {p.seller.name || p.seller.email} ({p.seller.role === "AGENT" ? "Agent" : "Property Owner"})
              {p.seller.verified && <span style={{ color: COLORS.primaryGreen }}> — Verified account</span>}
              {p.seller.phone && <> — {p.seller.phone}</>}
              {p.representingName && <> — representing {p.representingName}</>}
            </div>

            <Link
              href={`/properties/${p.id}/documents`}
              className="dk-admin-link"
              style={{ color: COLORS.primaryGreen, fontWeight: 500, fontSize: "13px", textDecoration: "none" }}
            >
              View supporting documents
            </Link>

            {/* Action buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
              <button
                className="dk-admin-btn"
                disabled={loadingId === p.id}
                onClick={() => toggleVerified(p.id, p.verified)}
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.textDark,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {loadingId === p.id ? "Working..." : p.verified ? "Mark Not Verified" : "Mark Verified"}
              </button>
              <button
                className="dk-admin-btn"
                disabled={loadingId === p.id}
                onClick={() => toggleFeatured(p.id, p.featured)}
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.textDark,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {loadingId === p.id ? "Working..." : p.featured ? "Unfeature" : "Feature"}
              </button>
              <button
                className="dk-admin-btn"
                disabled={loadingId === p.id}
                onClick={() => toggleShowContact(p.id, p.showContact)}
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.textDark,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {loadingId === p.id ? "Working..." : p.showContact ? "Hide contact from public" : "Show contact to public"}
              </button>
              <button
                className="dk-admin-btn dk-admin-btn-delete"
                disabled={loadingId === p.id}
                onClick={() => handleDelete(p.id, p.title)}
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.dangerRed,
                  border: `1px solid ${COLORS.dangerRed}55`,
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {loadingId === p.id ? "Working..." : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}