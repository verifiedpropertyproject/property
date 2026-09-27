"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isValidPhone, PHONE_FORMAT_HINT, PHONE_INPUT_PATTERN } from "@/lib/phoneValidation";

export default function PhoneForm({ currentPhone }: { currentPhone: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(currentPhone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidPhone(phone)) {
      setError(PHONE_FORMAT_HINT);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to save (status ${res.status}).`);
        return;
      }

      setSuccess("Saved.");
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="phone" className="sr-only">
        Phone number
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="relative max-w-xs flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--dk-muted)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path
                d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern={PHONE_INPUT_PATTERN}
            placeholder="07XXXXXXXX or +2547XXXXXXXX"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] py-2 pl-9 pr-3 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 placeholder:text-[var(--dk-placeholder)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-shrink-0"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      <p className="m-0 text-xs text-[var(--dk-muted)]">
        {PHONE_FORMAT_HINT} Buyers and sellers you connect with will see this number.
      </p>

      {error && (
        <p className="m-0 flex items-center gap-1.5 text-sm text-[var(--dk-danger-ink)]">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
      {success && (
        <p className="m-0 flex items-center gap-1.5 text-sm text-[var(--dk-primary)]">
          <span aria-hidden="true">✓</span> {success}
        </p>
      )}
    </form>
  );
}