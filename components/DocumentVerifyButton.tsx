"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentVerifyButton({
  documentId,
  verified,
}: {
  documentId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/documents/${documentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !verified }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3.5 py-1.5 text-sm font-semibold text-[var(--dk-heading)] transition-colors duration-150 hover:border-[var(--dk-border-hover)] hover:bg-[var(--dk-ivory)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : verified ? "Mark as pending" : "Mark as received"}
      </button>

      {error && <span className="text-sm text-[var(--dk-danger-ink)]"> {error}</span>}
    </span>
  );
}
