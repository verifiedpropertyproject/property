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
    <form onSubmit={handleSubmit}>
      <label>
        Commission %
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          disabled={loading}
        />
      </label>

      <button type="submit" disabled={loading || percent === currentPercent}>
        {loading ? "Saving..." : "Update rate"}
      </button>

      {error && <span>{error}</span>}
    </form>
  );
}
