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
      <p>
        No listings waiting for review.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p>
          {error}
        </p>
      )}

      <ul>
        {properties.map((p) => (
          <li key={p.id}>
            <div>
              <strong>{p.title}</strong>{" "}
              <span>
                — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} — {p.listingType}
              </span>{" "}
              <span>
                KSh {p.price.toLocaleString()}
              </span>
            </div>

            <div>
              {p.location}
              {p.bedrooms !== null && <> — {p.bedrooms} bed</>}
              {p.bathrooms !== null && <> — {p.bathrooms} bath</>}
              {p.acreage !== null && <> — {p.acreage} acres</>}
            </div>

            <div>
              {p.description}
            </div>

            <div>
              Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
              {p.seller.verified && <span> — Verified account</span>}
            </div>

            {p.representingName && (
              <div>
                Representing: {p.representingName}
                {p.representingContact && <> ({p.representingContact})</>}
              </div>
            )}

            <Link href={`/properties/${p.id}/documents`}>
              View supporting documents
            </Link>

            <div>
              <button
                disabled={loadingId === p.id}
                onClick={() => handleDecision(p.id, "APPROVED")}
              >
                {loadingId === p.id ? "Working..." : "Approve"}
              </button>

              <button
                disabled={loadingId === p.id}
                onClick={() => handleRequestChanges(p.id, p.title)}
              >
                {loadingId === p.id ? "Working..." : "Request changes"}
              </button>

              <button
                disabled={loadingId === p.id}
                onClick={() => handleDecision(p.id, "REJECTED")}
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