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
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <label htmlFor="phone" className="text-sm font-medium text-[var(--dk-ink)]">
        Phone number
      </label>

      <input
        id="phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        pattern={PHONE_INPUT_PATTERN}
        placeholder="07XXXXXXXX or +2547XXXXXXXX"
        className="w-full max-w-xs rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 placeholder:text-[var(--dk-placeholder)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
      />

      <p className="m-0 text-xs text-[var(--dk-muted)]">{PHONE_FORMAT_HINT}</p>

      {currentPhone && phone === currentPhone && (
        <p className="m-0 text-xs text-[var(--dk-muted)]">This matches the phone number currently saved on your account.</p>
      )}

      <div className="mt-1">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {error && <p className="m-0 text-sm text-[var(--dk-danger-ink)]">{error}</p>}
      {success && <p className="m-0 text-sm text-[var(--dk-primary)]">{success}</p>}
    </form>
  );
}