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
  success: "bg-[#E4F5E9] text-[#17843C]",
  warning: "bg-[#FCF0DC] text-[#B4770E]",
  danger: "bg-[#FBE7E5] text-[#C0392B]",
  neutral: "bg-[#EEF1EF] text-[#5B6660]",
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

      <p className="text-sm leading-6 text-[#566B60] m-0">
        {status === "NOT_SUBMITTED" &&
          "Submit an identity verification request so admins can review and verify your account. Once approved, your listings will show this status."}
        {status === "PENDING" && "Your request is with an admin for review. You'll be notified once it's been decided."}
        {status === "APPROVED" && "Your identity has been verified. This is shown on your listings."}
        {status === "REJECTED" && "Your last request wasn't approved. You can review the note below and submit again."}
      </p>

      {status === "REJECTED" && note && (
        <p className="text-sm leading-6 text-[#C0392B] m-0">Admin note: {note}</p>
      )}

      {canRequest && (
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={handleRequest}
            className="inline-flex items-center rounded-lg bg-[#17843C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F5D2A] disabled:opacity-60"
          >
            {loading ? "Submitting..." : status === "REJECTED" ? "Resubmit request" : "Request identity verification"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-[#C0392B] m-0">{error}</p>}
    </div>
  );
}
