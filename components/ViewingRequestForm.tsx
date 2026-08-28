"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

// Formats a Date as "YYYY-MM-DDTHH:mm" in the browser's local time, which is what a
// datetime-local input's value/min attributes expect (unlike toISOString(), which is UTC).
function toLocalDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const fieldInputClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2.5 text-sm font-normal text-[var(--dk-ink)] outline-none transition-colors duration-150 placeholder:text-[var(--dk-placeholder)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]";

export default function ViewingRequestForm({ propertyId }: { propertyId: string }) {
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Computed after mount (not during SSR) so the min bound reflects the buyer's own clock and
  // never causes a server/client render mismatch.
  const [minDateTime, setMinDateTime] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMinDateTime(toLocalDateTimeInputValue(new Date()));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!preferredDate) {
      setError("Choose a preferred date and time first.");
      return;
    }

    if (new Date(preferredDate).getTime() < Date.now()) {
      setError("Choose a date and time in the future.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/viewing-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredDate: new Date(preferredDate).toISOString(),
          message,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to send viewing request (status ${res.status}).`);
        return;
      }

      setPreferredDate("");
      setMessage("");
      setSuccess("Viewing request sent for review.");
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--dk-ink)]">
          Preferred date and time
          <input
            type="datetime-local"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            min={minDateTime}
            required
            className={fieldInputClass}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--dk-ink)]">
          Anything the seller should know? (optional)
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className={`resize-y ${fieldInputClass}`}
          />
        </label>
      </div>

      {error && (
        <p className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
          {error}
        </p>
      )}

      {success && (
        <p className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-primary)]/30 bg-[var(--dk-success-bg)] px-3.5 py-2 text-sm text-[var(--dk-primary)]">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-fit items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Request a viewing"}
      </button>
    </form>
  );
}
