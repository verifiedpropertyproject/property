"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DAKTOP_DECISIONS, DAKTOP_DECISION_LABELS } from "@/lib/verificationStatus";

const checkboxRowClass = "flex items-center gap-2 text-sm text-[var(--dk-ink)]";
const checkboxInputClass = "h-4 w-4 shrink-0 accent-[var(--dk-primary)]";

export default function VerificationStatusForm({
  propertyId,
  currentLocationVerified,
  currentOwnershipVerified,
  currentSurveyVerified,
  currentDaktopDecision,
}: {
  propertyId: string;
  currentLocationVerified: boolean;
  currentOwnershipVerified: boolean;
  currentSurveyVerified: boolean;
  currentDaktopDecision: string;
}) {
  const router = useRouter();
  const [locationVerified, setLocationVerified] = useState(currentLocationVerified);
  const [ownershipVerified, setOwnershipVerified] = useState(currentOwnershipVerified);
  const [surveyVerified, setSurveyVerified] = useState(currentSurveyVerified);
  const [daktopDecision, setDaktopDecision] = useState(currentDaktopDecision);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unchanged =
    locationVerified === currentLocationVerified &&
    ownershipVerified === currentOwnershipVerified &&
    surveyVerified === currentSurveyVerified &&
    daktopDecision === currentDaktopDecision;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (unchanged) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/verification-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationVerified, ownershipVerified, surveyVerified, daktopDecision }),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            checked={locationVerified}
            onChange={(e) => setLocationVerified(e.target.checked)}
            disabled={loading}
            className={checkboxInputClass}
          />
          Location verified
        </label>

        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            checked={ownershipVerified}
            onChange={(e) => setOwnershipVerified(e.target.checked)}
            disabled={loading}
            className={checkboxInputClass}
          />
          Ownership verified
        </label>

        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            checked={surveyVerified}
            onChange={(e) => setSurveyVerified(e.target.checked)}
            disabled={loading}
            className={checkboxInputClass}
          />
          Survey verified
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--dk-ink)]">
          Daktop decision
          <select
            value={daktopDecision}
            onChange={(e) => setDaktopDecision(e.target.value)}
            disabled={loading}
            className="rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {DAKTOP_DECISIONS.map((d) => (
              <option key={d} value={d}>
                {DAKTOP_DECISION_LABELS[d]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading || unchanged}
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update verification status"}
        </button>
      </div>

      {error && <span className="w-full text-sm text-[var(--dk-danger-ink)]">{error}</span>}
    </form>
  );
}
