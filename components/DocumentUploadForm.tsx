"use client";

import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "", label: "-- Not specified --" },
  ...DOCUMENT_TYPES.map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] })),
];

export default function DocumentUploadForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Choose at least one file to upload.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }
      if (documentType) {
        formData.append("documentType", documentType);
      }

      const res = await fetch(`/api/properties/${propertyId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Upload failed (status ${res.status}).`);
        return;
      }

      setSuccess(
        `Submitted ${data.documents.length} document${data.documents.length === 1 ? "" : "s"}. You can add another below if you have more.`
      );
      setDocumentType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
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
          Document type (optional)
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm font-normal text-[var(--dk-ink)] outline-none transition-colors duration-150 hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
          >
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--dk-ink)]">
          File(s)
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            className="rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm font-normal text-[var(--dk-ink)] outline-none transition-colors duration-150 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--dk-ivory)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--dk-primary)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
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
        {loading ? "Submitting..." : "Submit document"}
      </button>
    </form>
  );
}