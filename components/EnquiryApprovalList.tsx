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
      <p className="text-sm text-[var(--dk-muted)]">
        No enquiries waiting for review.
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
        {enquiries.map((e) => (
          <li
            key={e.id}
            className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-card)] p-4.5 transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)] md:p-5"
          >
            <div className="text-sm text-[var(--dk-muted)]">
              <span>Re: </span>
              <Link
                href={`/properties/${e.property.id}`}
                className="font-semibold text-[var(--dk-heading)] no-underline hover:text-[var(--dk-primary)]"
              >
                <strong>{e.property.title}</strong>
              </Link>
            </div>

            <div className="mt-2 rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-3.5 py-3 text-sm text-[var(--dk-ink)]">
              <span className="font-semibold text-[var(--dk-heading)]">
                From {e.buyer.name || e.buyer.email}:
              </span>{" "}
              <span>{e.message}</span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <button
                disabled={loadingId === e.id}
                onClick={() => handleDecision(e.id, "APPROVED")}
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingId === e.id ? "Working..." : "Approve"}
              </button>

              <button
                disabled={loadingId === e.id}
                onClick={() => handleDecision(e.id, "REJECTED")}
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-4 py-2 text-sm font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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