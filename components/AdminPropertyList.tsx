"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvailabilityForm from "@/components/AvailabilityForm";
import CommissionRateForm from "@/components/CommissionRateForm";
import DocumentVerifyButton from "@/components/DocumentVerifyButton";
import VerificationStatusForm from "@/components/VerificationStatusForm";
import { getRoleLabel } from "@/lib/propertyConstants";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";
import { getAvailabilityLabel, getAvailabilityBadgeClass } from "@/lib/availabilityStatus";

type ManagedProperty = {
  id: string;
  title: string;
  status: string;
  adminNote: string | null;
  verified: boolean;
  daktopVerified: boolean;
  locationVerified: boolean;
  ownershipVerified: boolean;
  surveyVerified: boolean;
  daktopDecision: string;
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
  documents: { id: string; documentType: string | null; verified: boolean }[];
};

// ---------------------------------------------------------------------------
// Same badge vocabulary as app/dashboard/page.tsx (Tone / Badge), duplicated
// here since it's a client component in its own file — kept visually
// identical so admin actions read consistently between the two.
// ---------------------------------------------------------------------------
type Tone = "role" | "success" | "warning" | "danger" | "accent" | "neutral";

function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const toneClasses: Record<Tone, string> = {
    role: "bg-[var(--dk-dark)] text-white",
    success: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)]",
    warning: "bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)]",
    danger: "bg-[var(--dk-danger-bg)] text-[var(--dk-danger-ink)]",
    accent: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)]",
    neutral: "bg-[var(--dk-border)] text-[var(--dk-muted)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-0.5 text-xs font-semibold leading-6 ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function statusTone(status: string): Tone {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
    case "CHANGES_REQUESTED":
      return "warning";
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
}

const actionButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] px-4 py-2 text-sm font-semibold text-[var(--dk-heading)] transition-colors duration-150 hover:bg-[var(--dk-ivory)] hover:border-[var(--dk-border-hover)] disabled:cursor-not-allowed disabled:opacity-60";

const dangerButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-4 py-2 text-sm font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

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
    return <p className="text-sm text-[var(--dk-muted)]">No listings yet.</p>;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-xl border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
          {error}
        </p>
      )}

      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {properties.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] p-4.5 transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)] md:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/properties/${p.id}`}
                className="text-lg font-bold text-[var(--dk-heading)] no-underline hover:text-[var(--dk-primary)]"
              >
                {p.title}
              </Link>
              <span className="text-lg font-bold text-[var(--dk-heading)]">
                KSh {p.price.toLocaleString()}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge label={`Status: ${p.status}`} tone={statusTone(p.status)} />
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getAvailabilityBadgeClass(
                  p.availabilityStatus
                )}`}
              >
                {getAvailabilityLabel(p.availabilityStatus)}
              </span>
              <Badge label={p.verified ? "Verified" : "Not Verified"} tone={p.verified ? "success" : "neutral"} />
              {p.daktopVerified && <Badge label="DAKTOP VERIFIED" tone="accent" />}
              {p.featured && <Badge label="FEATURED" tone="role" />}
              <Badge
                label={p.showContact ? "Contact shown publicly" : "Contact hidden from public"}
                tone={p.showContact ? "success" : "neutral"}
              />
            </div>

            <div className="mt-3">
              <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
            </div>

            <div className="mt-3.5 rounded-xl border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-3.5 py-3 text-sm text-[var(--dk-ink)]">
              <p className="m-0">
                Commission: {(p.commissionRate * 100).toFixed(p.commissionRate * 100 % 1 === 0 ? 0 : 2)}%
                {p.commissionAgreedAt
                  ? ` — agreed by lister on ${new Date(p.commissionAgreedAt).toLocaleDateString()}`
                  : " — not yet on record for this listing"}
              </p>
              <div className="mt-2">
                <CommissionRateForm propertyId={p.id} currentRate={p.commissionRate} />
              </div>
              {p.commissionAgreedAt && (
                <a
                  href={`/api/properties/${p.id}/commission-agreement`}
                  className="mt-2 inline-block text-sm font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)]"
                >
                  Download signed certificate (PDF)
                </a>
              )}
            </div>

            <div className="mt-3 text-xs text-[var(--dk-muted)]">
              {p.views} views — {p._count.savedBy} saved
            </div>

            {p.adminNote && (
              <div className="mt-3 rounded-xl border border-[var(--dk-gold)] bg-[var(--dk-gold-bg)] px-3.5 py-2 text-sm italic text-[var(--dk-gold-deep)]">
                Admin note: {p.adminNote}
              </div>
            )}

            <div className="mt-3 text-sm text-[var(--dk-muted)]">
              Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
              {p.seller.verified && <span className="text-[var(--dk-primary)]"> — Verified account</span>}
              {p.seller.phone && <> — {p.seller.phone}</>}
              {p.representingName && <> — representing {p.representingName}</>}
            </div>

            <Link
              href={`/properties/${p.id}/documents`}
              className="mt-3 inline-block text-sm font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)]"
            >
              View supporting documents
            </Link>

            <div className="mt-4 border-t border-[var(--dk-border)] pt-4">
              <h4 className="m-0 text-xs font-semibold uppercase tracking-wider text-[var(--dk-muted)]">
                Daktop verification{p.daktopVerified ? " — DAKTOP VERIFIED" : ""}
              </h4>

              {p.documents.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--dk-muted)]">No documents submitted yet.</p>
              ) : (
                <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
                  {p.documents.map((doc) => (
                    <li key={doc.id} className="flex flex-wrap items-center gap-2 text-sm text-[var(--dk-ink)]">
                      <span>
                        {doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Document"} received:
                      </span>
                      <Badge label={doc.verified ? "Verified" : "Pending"} tone={doc.verified ? "success" : "warning"} />
                      <DocumentVerifyButton documentId={doc.id} verified={doc.verified} />
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3">
                <VerificationStatusForm
                  propertyId={p.id}
                  currentLocationVerified={p.locationVerified}
                  currentOwnershipVerified={p.ownershipVerified}
                  currentSurveyVerified={p.surveyVerified}
                  currentDaktopDecision={p.daktopDecision}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                className={actionButtonClass}
                disabled={loadingId === p.id}
                onClick={() => toggleVerified(p.id, p.verified)}
              >
                {loadingId === p.id ? "Working..." : p.verified ? "Mark Not Verified" : "Mark Verified"}
              </button>
              <button
                type="button"
                className={actionButtonClass}
                disabled={loadingId === p.id}
                onClick={() => toggleFeatured(p.id, p.featured)}
              >
                {loadingId === p.id ? "Working..." : p.featured ? "Unfeature" : "Feature"}
              </button>
              <button
                type="button"
                className={actionButtonClass}
                disabled={loadingId === p.id}
                onClick={() => toggleShowContact(p.id, p.showContact)}
              >
                {loadingId === p.id ? "Working..." : p.showContact ? "Hide contact from public" : "Show contact to public"}
              </button>
              <button
                type="button"
                className={dangerButtonClass}
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
