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
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Document type (optional)
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          File(s)
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          />
        </label>
      </div>

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

      <button
        type="submit"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit document"}
      </button>
    </form>
  );
}