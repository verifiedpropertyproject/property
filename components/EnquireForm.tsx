"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function EnquireForm({ propertyId }: { propertyId: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Enter a message first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/enquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to send enquiry (status ${res.status}).`);
        return;
      }

      setMessage("");
      setSuccess("Enquiry sent to the seller.");
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
          Ask the seller a question
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            required
            className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2.5 text-sm font-normal text-[var(--dk-ink)] outline-none transition-colors duration-150 placeholder:text-[var(--dk-placeholder)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
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
        {loading ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}