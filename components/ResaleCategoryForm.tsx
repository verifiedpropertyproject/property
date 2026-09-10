"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RESALE_CATEGORIES, getResaleCategoryLabel } from "@/lib/resaleCategory";

const NONE_VALUE = "";

const RESALE_CATEGORY_OPTIONS = [
  { value: NONE_VALUE, label: "— Not a resale category —" },
  ...RESALE_CATEGORIES.map((value) => ({ value, label: getResaleCategoryLabel(value) })),
];

export default function ResaleCategoryForm({
  propertyId,
  currentCategory,
}: {
  propertyId: string;
  currentCategory: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentCategory || NONE_VALUE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (value === (currentCategory || NONE_VALUE)) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/resale-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resaleCategory: value || null }),
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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2.5">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
        className="rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {RESALE_CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading || value === (currentCategory || NONE_VALUE)}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Update resale category"}
      </button>

      {error && <span className="w-full text-sm text-[var(--dk-danger-ink)]">{error}</span>}
    </form>
  );
}
