"use client";

import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "", label: "-- Not specified --" },
  ...DOCUMENT_TYPES.map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] })),
];

// --- Color palette (matches Daktop360 admin components) ---
const COLORS = {
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  successGreen: "#15803D",
  successBg: "#F0FDF4",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  sectionBg: "#F7FAF8",
  white: "#FFFFFF",
  disabledBg: "#F3F4F6",
};

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 500,
  fontSize: "13px",
  display: "block",
  marginBottom: "6px",
};

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

      setSuccess(`Uploaded ${data.documents.length} document${data.documents.length === 1 ? "" : "s"}.`);
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
    <form
      onSubmit={handleSubmit}
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: COLORS.sectionBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        maxWidth: "420px",
      }}
    >
      <style>{`
        .dk-upload-select:focus, .dk-upload-select:focus-visible,
        .dk-upload-file:focus, .dk-upload-file:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }
        .dk-upload-file::file-selector-button {
          background-color: ${COLORS.white};
          color: ${COLORS.textDark};
          border: 1px solid ${COLORS.border};
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 10px;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .dk-upload-file:hover::file-selector-button {
          background-color: ${COLORS.sectionBg};
          border-color: ${COLORS.primaryGreen};
        }
        .dk-upload-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-upload-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-upload-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <div>
        <label style={fieldLabelStyle}>
          Document type (optional)
          <select
            className="dk-upload-select"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            style={{
              marginTop: "2px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textDark,
              fontSize: "14px",
              backgroundColor: COLORS.white,
              width: "100%",
              boxSizing: "border-box",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
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
        <label style={fieldLabelStyle}>
          File(s)
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            className="dk-upload-file"
            style={{
              marginTop: "2px",
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 0",
              color: COLORS.textGray,
              fontSize: "13px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              backgroundColor: COLORS.white,
              paddingLeft: "10px",
            }}
          />
        </label>
      </div>

      {error && (
        <p
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.dangerRed,
            border: `1px solid ${COLORS.dangerRed}33`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          style={{
            backgroundColor: COLORS.successBg,
            color: COLORS.successGreen,
            border: `1px solid ${COLORS.successGreen}33`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            margin: 0,
          }}
        >
          {success}
        </p>
      )}

      <button
        type="submit"
        className="dk-upload-btn"
        disabled={loading}
        style={{
          backgroundColor: loading ? COLORS.disabledBg : COLORS.primaryGreen,
          color: loading ? "#9CA3AF" : COLORS.white,
          border: "none",
          borderRadius: "8px",
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
          transition: "background-color 0.2s ease, transform 0.15s ease",
        }}
      >
        {loading ? "Uploading..." : "+ Upload Document"}
      </button>
    </form>
  );
}