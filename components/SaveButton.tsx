"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SaveButton({ propertyId, initiallySaved }: { propertyId: string; initiallySaved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/properties/${propertyId}/save`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update (status ${res.status}).`);
        return;
      }

      setSaved(data.saved);
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={toggle}
        disabled={loading}
        aria-pressed={saved}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
          saved
            ? "border-[var(--dk-primary)]/30 bg-[var(--dk-success-bg)] text-[var(--dk-primary)] hover:bg-[var(--dk-primary-ring)]"
            : "border-[var(--dk-border)] bg-[var(--dk-card)] text-[var(--dk-ink)] hover:border-[var(--dk-border-hover)] hover:bg-[var(--dk-ivory)]"
        }`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        {loading ? "Working..." : saved ? "Saved" : "Save property"}
      </button>

      {error && (
        <p className="m-0 text-xs text-[var(--dk-danger-ink)]">{error}</p>
      )}
    </div>
  );
}