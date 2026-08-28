"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteDocumentButton({ documentId, fileName }: { documentId: string; fileName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to delete (status ${res.status}).`);
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
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-1.5 text-sm font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <span className="text-sm text-[var(--dk-danger-ink)]">{error}</span>
      )}
    </span>
  );
}