"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getIdentityVerificationLabel,
  canRequestIdentityVerification,
} from "@/lib/identityVerification";

type Tone = "success" | "warning" | "danger" | "neutral";

function toneForStatus(status: string): Tone {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
}

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)]",
  warning: "bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)]",
  danger: "bg-[var(--dk-danger-bg)] text-[var(--dk-danger-ink)]",
  neutral: "bg-[var(--dk-border)] text-[var(--dk-muted)]",
};

export default function IdentityVerificationRequestForm({
  status,
  note,
}: {
  status: string;
  note: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canRequest = canRequestIdentityVerification(status);
  const tone = toneForStatus(status);

  async function handleRequest() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/profile/identity-verification", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to submit request (status ${res.status}).`);
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-0.5 text-xs font-semibold leading-6 ${TONE_CLASSES[tone]}`}
        >
          {getIdentityVerificationLabel(status)}
        </span>
      </div>

      <p className="text-sm leading-6 text-[var(--dk-muted)] m-0">
        {status === "NOT_SUBMITTED" &&
          "Submit an identity verification request so admins can review and verify your account. Once approved, your listings will show this status."}
        {status === "PENDING" && "Your request is with an admin for review. You'll be notified once it's been decided."}
        {status === "APPROVED" && "Your identity has been verified. This is shown on your listings."}
        {status === "REJECTED" && "Your last request wasn't approved. You can review the note below and submit again."}
      </p>

      {status === "REJECTED" && note && (
        <p className="text-sm leading-6 text-[var(--dk-danger-ink)] m-0">Admin note: {note}</p>
      )}

      {canRequest && (
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={handleRequest}
            className="inline-flex items-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : status === "REJECTED" ? "Resubmit request" : "Request identity verification"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-[var(--dk-danger-ink)] m-0">{error}</p>}
    </div>
  );
}
