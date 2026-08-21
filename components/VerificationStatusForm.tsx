"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DAKTOP_DECISIONS, DAKTOP_DECISION_LABELS } from "@/lib/verificationStatus";

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
    <form onSubmit={handleSubmit}>
      <label>
        <input
          type="checkbox"
          checked={locationVerified}
          onChange={(e) => setLocationVerified(e.target.checked)}
          disabled={loading}
        />
        {" "}Location verified
      </label>

      <label>
        <input
          type="checkbox"
          checked={ownershipVerified}
          onChange={(e) => setOwnershipVerified(e.target.checked)}
          disabled={loading}
        />
        {" "}Ownership verified
      </label>

      <label>
        <input
          type="checkbox"
          checked={surveyVerified}
          onChange={(e) => setSurveyVerified(e.target.checked)}
          disabled={loading}
        />
        {" "}Survey verified
      </label>

      <label>
        {" "}Daktop decision:{" "}
        <select
          value={daktopDecision}
          onChange={(e) => setDaktopDecision(e.target.value)}
          disabled={loading}
        >
          {DAKTOP_DECISIONS.map((d) => (
            <option key={d} value={d}>
              {DAKTOP_DECISION_LABELS[d]}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={loading || unchanged}>
        {loading ? "Saving..." : "Update verification status"}
      </button>

      {error && <span> {error}</span>}
    </form>
  );
}
