"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PendingViewingRequest = {
  id: string;
  preferredDate: string | Date;
  message: string | null;
  property: { id: string; title: string };
  buyer: { name: string | null; email: string };
};

export default function ViewingRequestApprovalList({
  viewingRequests,
}: {
  viewingRequests: PendingViewingRequest[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDecision(id: string, status: "APPROVED" | "REJECTED") {
    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(`/api/viewing-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update viewing request (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (viewingRequests.length === 0) {
    return <p>No viewing requests waiting for review.</p>;
  }

  return (
    <div>
      {error && <p>{error}</p>}

      <ul>
        {viewingRequests.map((v) => (
          <li key={v.id}>
            <div>
              <span>Re: </span>
              <Link href={`/properties/${v.property.id}`}>
                <strong>{v.property.title}</strong>
              </Link>
            </div>

            <div>
              <span>From {v.buyer.name || v.buyer.email}, wants to view on</span>{" "}
              <strong>{new Date(v.preferredDate).toLocaleString()}</strong>
            </div>

            {v.message && (
              <div>
                <span>Note: </span>
                <span>{v.message}</span>
              </div>
            )}

            <div>
              <button
                disabled={loadingId === v.id}
                onClick={() => handleDecision(v.id, "APPROVED")}
              >
                {loadingId === v.id ? "Working..." : "Approve"}
              </button>

              <button
                disabled={loadingId === v.id}
                onClick={() => handleDecision(v.id, "REJECTED")}
              >
                {loadingId === v.id ? "Working..." : "Reject"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
