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
    <form onSubmit={handleSubmit}>
      <label>
        Phone number
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          pattern={PHONE_INPUT_PATTERN}
          placeholder="07XXXXXXXX or +2547XXXXXXXX"
        />
        <small>
          {PHONE_FORMAT_HINT}
        </small>
        {currentPhone && phone === currentPhone && (
          <small>✓ Current phone number</small>
        )}
      </label>

      <button
        type="submit"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save"}
      </button>

      {error && (
        <p>
          {error}
        </p>
      )}

      {success && (
        <p>
          {success}
        </p>
      )}
    </form>
  );
}