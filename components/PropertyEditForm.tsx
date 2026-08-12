"use client";

import { useState, useRef } from "react";
import type { FormEvent, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PRICE_MIN,
  PRICE_MAX,
  BEDROOMS_MAX,
  BATHROOMS_MAX,
  ACREAGE_MAX,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MIN_LENGTH,
} from "@/lib/propertyConstants";

type EditableProperty = {
  id: string;
  title: string;
  description: string;
  location: string;
  propertyType: string;
  propertyTypeOther: string | null;
  listingType: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  acreage: number | null;
  imageUrl: string | null;
  representingName: string | null;
  representingContact: string | null;
};

// --- Color palette (matches Daktop360 homepage / admin components) ---
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

const fieldLabelStyle: CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 500,
  fontSize: "13px",
  display: "block",
  marginBottom: "6px",
};

const fieldInputStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  boxSizing: "border-box",
  fontSize: "14px",
  fontFamily: "inherit",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

const fieldGroupStyle: CSSProperties = {
  marginBottom: "16px",
};

export default function PropertyEditForm({ property, isAgent }: { property: EditableProperty; isAgent: boolean }) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(property.title);
  const [description, setDescription] = useState(property.description);
  const [location, setLocation] = useState(property.location);
  const [propertyType, setPropertyType] = useState(property.propertyType);
  const [propertyTypeOther, setPropertyTypeOther] = useState(property.propertyTypeOther || "");
  const [listingType, setListingType] = useState(property.listingType);
  const [price, setPrice] = useState(String(property.price));
  const [bedrooms, setBedrooms] = useState(property.bedrooms !== null ? String(property.bedrooms) : "");
  const [bathrooms, setBathrooms] = useState(property.bathrooms !== null ? String(property.bathrooms) : "");
  const [acreage, setAcreage] = useState(property.acreage !== null ? String(property.acreage) : "");
  const [representingName, setRepresentingName] = useState(property.representingName || "");
  const [representingContact, setRepresentingContact] = useState(property.representingContact || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isAgent && !representingName.trim()) {
      setError("As an agent, you must state who you're representing (the property owner's name).");
      return;
    }

    if (propertyType === "OTHER" && !propertyTypeOther.trim()) {
      setError('Since you selected "Other", please specify what type of property it is.');
      return;
    }

    const hasNewImage = !!imageInputRef.current?.files?.[0];
    if (!property.imageUrl && !hasNewImage) {
      setError("A photo is required for the listing. Please upload one.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("propertyType", propertyType);
      formData.append("propertyTypeOther", propertyTypeOther);
      formData.append("listingType", listingType);
      formData.append("price", price);
      formData.append("bedrooms", bedrooms);
      formData.append("bathrooms", bathrooms);
      formData.append("acreage", acreage);
      formData.append("representingName", representingName);
      formData.append("representingContact", representingContact);
      const imageFile = imageInputRef.current?.files?.[0];
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`/api/properties/${property.id}/edit`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to save changes (status ${res.status}).`);
        return;
      }

      setSuccess("Saved. Your listing has been resubmitted for review.");
      router.push("/dashboard");
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
        borderRadius: "14px",
        padding: "24px",
        maxWidth: "560px",
      }}
    >
      <style>{`
        .dk-edit-input:focus, .dk-edit-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }
        .dk-edit-file::file-selector-button {
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
        .dk-edit-file:hover::file-selector-button {
          background-color: ${COLORS.sectionBg};
          border-color: ${COLORS.primaryGreen};
        }
        .dk-edit-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover} !important;
        }
        .dk-edit-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-edit-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <div style={fieldGroupStyle}>
        <label style={fieldLabelStyle}>
          Title
          <input
            className="dk-edit-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={TITLE_MIN_LENGTH}
            maxLength={TITLE_MAX_LENGTH}
            required
            style={{ ...fieldInputStyle, marginTop: "2px" }}
          />
        </label>
      </div>

      <div style={fieldGroupStyle}>
        <label style={fieldLabelStyle}>
          Description
          <textarea
            className="dk-edit-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            minLength={DESCRIPTION_MIN_LENGTH}
            maxLength={DESCRIPTION_MAX_LENGTH}
            required
            style={{ ...fieldInputStyle, marginTop: "2px", resize: "vertical" }}
          />
        </label>
      </div>

      <div style={fieldGroupStyle}>
        <label style={fieldLabelStyle}>
          Location
          <input
            className="dk-edit-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            minLength={LOCATION_MIN_LENGTH}
            required
            style={{ ...fieldInputStyle, marginTop: "2px" }}
          />
        </label>
      </div>

      <div style={fieldGroupStyle}>
        <label style={fieldLabelStyle}>
          Property type
          <select
            className="dk-edit-input"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            style={{ ...fieldInputStyle, marginTop: "2px", backgroundColor: COLORS.white }}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {propertyType === "OTHER" && (
        <div style={fieldGroupStyle}>
          <label style={fieldLabelStyle}>
            Please specify property type
            <input
              className="dk-edit-input"
              value={propertyTypeOther}
              onChange={(e) => setPropertyTypeOther(e.target.value)}
              placeholder="e.g. Boathouse, Warehouse, Farm"
              required
              style={{ ...fieldInputStyle, marginTop: "2px" }}
            />
          </label>
        </div>
      )}

      <div style={fieldGroupStyle}>
        <label style={fieldLabelStyle}>
          Listing type
          <select
            className="dk-edit-input"
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            style={{ ...fieldInputStyle, marginTop: "2px", backgroundColor: COLORS.white }}
          >
            <option value="SALE">For sale</option>
            <option value="RENT">For rent</option>
          </select>
        </label>
      </div>

      <div style={fieldGroupStyle}>
        <label style={fieldLabelStyle}>
          Price (KSh)
          <input
            type="number"
            step="0.01"
            min={PRICE_MIN}
            max={PRICE_MAX}
            className="dk-edit-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={{ ...fieldInputStyle, marginTop: "2px" }}
          />
          <small style={{ display: "block", color: COLORS.textGray, fontSize: "12px", marginTop: "6px" }}>
            Minimum KSh {PRICE_MIN.toLocaleString()} — maximum KSh {PRICE_MAX.toLocaleString()}
          </small>
        </label>
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ ...fieldGroupStyle, flex: "1 1 140px" }}>
          <label style={fieldLabelStyle}>
            Bedrooms (optional)
            <input
              type="number"
              min="0"
              max={BEDROOMS_MAX}
              className="dk-edit-input"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              style={{ ...fieldInputStyle, marginTop: "2px" }}
            />
          </label>
        </div>

        <div style={{ ...fieldGroupStyle, flex: "1 1 140px" }}>
          <label style={fieldLabelStyle}>
            Bathrooms (optional)
            <input
              type="number"
              min="0"
              max={BATHROOMS_MAX}
              className="dk-edit-input"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              style={{ ...fieldInputStyle, marginTop: "2px" }}
            />
          </label>
        </div>

        <div style={{ ...fieldGroupStyle, flex: "1 1 140px" }}>
          <label style={fieldLabelStyle}>
            Acreage (optional)
            <input
              type="number"
              step="0.01"
              min="0"
              max={ACREAGE_MAX}
              className="dk-edit-input"
              value={acreage}
              onChange={(e) => setAcreage(e.target.value)}
              style={{ ...fieldInputStyle, marginTop: "2px" }}
            />
          </label>
        </div>
      </div>

      <div style={fieldGroupStyle}>
        {property.imageUrl && (
          <div style={{ marginBottom: "10px" }}>
            <span style={{ ...fieldLabelStyle, marginBottom: "8px" }}>Current photo:</span>
            <img
              src={property.imageUrl}
              alt="Current listing photo"
              width={240}
              style={{ borderRadius: "8px", border: `1px solid ${COLORS.border}`, display: "block" }}
            />
          </div>
        )}
        <label style={fieldLabelStyle}>
          {property.imageUrl ? "Replace photo (optional)" : "Photo"}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={!property.imageUrl}
            className="dk-edit-file"
            style={{
              marginTop: "2px",
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 0 8px 10px",
              color: COLORS.textGray,
              fontSize: "13px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              backgroundColor: COLORS.white,
            }}
          />
          {!property.imageUrl && (
            <small style={{ display: "block", color: COLORS.textGray, fontSize: "12px", marginTop: "6px" }}>
              Required — JPEG, PNG, or WEBP, max 5MB.
            </small>
          )}
        </label>
      </div>

      {isAgent && (
        <>
          <div style={fieldGroupStyle}>
            <label style={fieldLabelStyle}>
              Representing (owner&apos;s name)
              <input
                className="dk-edit-input"
                value={representingName}
                onChange={(e) => setRepresentingName(e.target.value)}
                placeholder="Who you're selling this on behalf of"
                required
                style={{ ...fieldInputStyle, marginTop: "2px" }}
              />
            </label>
          </div>
          <div style={fieldGroupStyle}>
            <label style={fieldLabelStyle}>
              Owner&apos;s contact (optional)
              <input
                className="dk-edit-input"
                value={representingContact}
                onChange={(e) => setRepresentingContact(e.target.value)}
                placeholder="Phone or email"
                style={{ ...fieldInputStyle, marginTop: "2px" }}
              />
            </label>
          </div>
        </>
      )}

      {error && (
        <p
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.dangerRed,
            border: `1px solid ${COLORS.dangerRed}33`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            margin: "0 0 16px 0",
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
            margin: "0 0 16px 0",
          }}
        >
          {success}
        </p>
      )}

      <button
        type="submit"
        className="dk-edit-btn"
        disabled={loading}
        style={{
          backgroundColor: loading ? COLORS.disabledBg : COLORS.primaryGreen,
          color: loading ? "#9CA3AF" : COLORS.white,
          border: "none",
          borderRadius: "8px",
          padding: "11px 22px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s ease, transform 0.15s ease",
        }}
      >
        {loading ? "Saving..." : "Save and resubmit for review"}
      </button>
    </form>
  );
}