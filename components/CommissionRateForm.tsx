"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function CommissionRateForm({
  propertyId,
  currentRate,
}: {
  propertyId: string;
  currentRate: number;
}) {
  const router = useRouter();
  // Edit as a plain percentage (e.g. "3") rather than the stored fraction (0.03) — friendlier
  // for an admin typing a number.
  const [percent, setPercent] = useState(String(currentRate * 100));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentPercent = String(currentRate * 100);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = Number(percent);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setError("Enter a percentage between 0 and 100.");
      return;
    }
    if (percent === currentPercent) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/commission-rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: parsed / 100 }),
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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2.5">
      <label className="flex items-center gap-2 text-sm font-medium text-[var(--dk-ink)]">
        Commission %
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          disabled={loading}
          className="w-24 rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <button
        type="submit"
        disabled={loading || percent === currentPercent}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Update rate"}
      </button>

      {error && <span className="w-full text-sm text-[var(--dk-danger-ink)]">{error}</span>}
    </form>
  );
}
