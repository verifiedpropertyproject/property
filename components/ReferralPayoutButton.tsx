"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReferralPayoutButton({
  referralId,
  currentStatus,
}: {
  referralId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextStatus = currentStatus === "PAID" ? "PENDING" : "PAID";

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/referrals/${referralId}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutStatus: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-1.5 text-xs font-semibold text-[var(--dk-ink)] transition-colors duration-150 hover:border-[var(--dk-border-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : currentStatus === "PAID" ? "Mark as pending" : "Mark as paid"}
      </button>
      {error && <span className="text-xs text-[var(--dk-danger-ink)]">{error}</span>}
    </div>
  );
}
