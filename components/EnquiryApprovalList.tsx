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
      <p>
        No enquiries waiting for review.
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
        {enquiries.map((e) => (
          <li key={e.id}>
            <div>
              <span>Re: </span>
              <Link href={`/properties/${e.property.id}`}>
                <strong>{e.property.title}</strong>
              </Link>
            </div>

            <div>
              <span>From {e.buyer.name || e.buyer.email}:</span>{" "}
              <span>{e.message}</span>
            </div>

            <div>
              <button
                disabled={loadingId === e.id}
                onClick={() => handleDecision(e.id, "APPROVED")}
              >
                {loadingId === e.id ? "Working..." : "Approve"}
              </button>

              <button
                disabled={loadingId === e.id}
                onClick={() => handleDecision(e.id, "REJECTED")}
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