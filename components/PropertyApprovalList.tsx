"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";

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
      <p className="text-sm text-[var(--dk-muted)]">
        No listings waiting for review.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
          {error}
        </p>
      )}

      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {properties.map((p) => (
          <li
            key={p.id}
            className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-card)] p-4.5 transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)] md:p-5"
          >
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <strong className="text-lg font-bold text-[var(--dk-heading)]">{p.title}</strong>{" "}
              <span className="text-sm text-[var(--dk-muted)]">
                — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} — {p.listingType}
              </span>{" "}
              <span className="text-sm font-semibold text-[var(--dk-heading)]">
                KSh {p.price.toLocaleString()}
              </span>
            </div>

            <div className="mt-1 text-sm text-[var(--dk-muted)]">
              {p.location}
              {p.bedrooms !== null && <> — {p.bedrooms} bed</>}
              {p.bathrooms !== null && <> — {p.bathrooms} bath</>}
              {p.acreage !== null && <> — {p.acreage} acres</>}
            </div>

            <div className="mt-2.5 text-sm text-[var(--dk-ink)]">
              {p.description}
            </div>

            <div className="mt-2.5 text-sm text-[var(--dk-muted)]">
              Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
              {p.seller.verified && <span className="text-[var(--dk-primary)]"> — Verified account</span>}
            </div>

            {p.representingName && (
              <div className="mt-1 text-sm text-[var(--dk-muted)]">
                Representing: {p.representingName}
                {p.representingContact && <> ({p.representingContact})</>}
              </div>
            )}

            <Link
              href={`/properties/${p.id}/documents`}
              className="mt-2.5 inline-block text-sm font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)]"
            >
              View supporting documents
            </Link>

            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <button
                disabled={loadingId === p.id}
                onClick={() => handleDecision(p.id, "APPROVED")}
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingId === p.id ? "Working..." : "Approve"}
              </button>

              <button
                disabled={loadingId === p.id}
                onClick={() => handleRequestChanges(p.id, p.title)}
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-4 py-2 text-sm font-semibold text-[var(--dk-heading)] transition-colors duration-150 hover:border-[var(--dk-border-hover)] hover:bg-[var(--dk-ivory)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingId === p.id ? "Working..." : "Request changes"}
              </button>

              <button
                disabled={loadingId === p.id}
                onClick={() => handleDecision(p.id, "REJECTED")}
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-4 py-2 text-sm font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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