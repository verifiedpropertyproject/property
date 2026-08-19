"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvailabilityForm from "@/components/AvailabilityForm";
import CommissionRateForm from "@/components/CommissionRateForm";

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
  commissionRate: number;
  commissionAgreedAt: string | Date | null;
  seller: { name: string | null; email: string; phone: string | null; role: string | null; verified: boolean };
  _count: { savedBy: number };
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
      <p>
        No listings yet.
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
              <Link href={`/properties/${p.id}`}>
                <strong>{p.title}</strong>
              </Link>
              <span>
                KSh {p.price.toLocaleString()}
              </span>
            </div>

            <div>
              <span>
                Status: {p.status}
              </span>
              <span>
                {p.verified ? "Verified" : "Not Verified"}
              </span>
              {p.featured && (
                <span>
                  FEATURED
                </span>
              )}
              <span>
                Contact {p.showContact ? "shown publicly" : "hidden from public"}
              </span>
            </div>

            <div>
              <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
            </div>

            <div>
              Commission: {(p.commissionRate * 100).toFixed(p.commissionRate * 100 % 1 === 0 ? 0 : 2)}%
              {p.commissionAgreedAt
                ? ` — agreed by lister on ${new Date(p.commissionAgreedAt).toLocaleDateString()}`
                : " — not yet on record for this listing"}
              <CommissionRateForm propertyId={p.id} currentRate={p.commissionRate} />
            </div>

            <div>
              {p.views} views — {p._count.savedBy} saved
            </div>

            {p.adminNote && (
              <div>
                Admin note: {p.adminNote}
              </div>
            )}

            <div>
              Listed by {p.seller.name || p.seller.email} ({p.seller.role === "AGENT" ? "Agent" : "Property Owner"})
              {p.seller.verified && <span> — Verified account</span>}
              {p.seller.phone && <> — {p.seller.phone}</>}
              {p.representingName && <> — representing {p.representingName}</>}
            </div>

            <Link href={`/properties/${p.id}/documents`}>
              View supporting documents
            </Link>

            <div>
              <button
                disabled={loadingId === p.id}
                onClick={() => toggleVerified(p.id, p.verified)}
              >
                {loadingId === p.id ? "Working..." : p.verified ? "Mark Not Verified" : "Mark Verified"}
              </button>
              <button
                disabled={loadingId === p.id}
                onClick={() => toggleFeatured(p.id, p.featured)}
              >
                {loadingId === p.id ? "Working..." : p.featured ? "Unfeature" : "Feature"}
              </button>
              <button
                disabled={loadingId === p.id}
                onClick={() => toggleShowContact(p.id, p.showContact)}
              >
                {loadingId === p.id ? "Working..." : p.showContact ? "Hide contact from public" : "Show contact to public"}
              </button>
              <button
                disabled={loadingId === p.id}
                onClick={() => handleDelete(p.id, p.title)}
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