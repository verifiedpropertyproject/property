"use client";

import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import LocationPicker, { type PickedLocation } from "@/components/LocationPicker";
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_SUGGESTIONS,
  PRICE_MIN,
  PRICE_MAX,
  SALE_PRICE_MIN,
  PRIME_PROPERTY_NOTICE,
  BEDROOMS_MAX,
  BATHROOMS_MAX,
  ACREAGE_MAX,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MIN_LENGTH,
  getPropertyTypeFields,
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
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  placeId: string | null;
  commissionRate: number;
  commissionAgreedAt: string | Date | null;
  commissionAgreementText: string | null;
};

const fieldInputClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm font-normal text-[var(--dk-ink)] outline-none transition-colors duration-150 placeholder:text-[var(--dk-placeholder)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]";

const fieldLabelClass = "flex flex-col gap-1.5 text-sm font-medium text-[var(--dk-ink)]";

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
  const [pin, setPin] = useState<PickedLocation | null>(
    property.latitude !== null && property.longitude !== null
      ? {
          latitude: property.latitude,
          longitude: property.longitude,
          address: property.address || "",
          placeId: property.placeId,
        }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fields = getPropertyTypeFields(propertyType);

  function handlePropertyTypeChange(nextType: string) {
    setPropertyType(nextType);
    // Clear out detail fields that no longer apply, so switching e.g. House -> Land can't
    // silently carry a leftover "3 bedrooms" into a land listing.
    const nextFields = getPropertyTypeFields(nextType);
    if (!nextFields.bedrooms) setBedrooms("");
    if (!nextFields.bathrooms) setBathrooms("");
    if (!nextFields.acreage) setAcreage("");
  }

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

    if (fields.acreageRequired && !acreage.trim()) {
      setError(`${fields.acreageLabel} is required for a land listing.`);
      return;
    }

    if (listingType === "SALE" && Number(price) < SALE_PRICE_MIN) {
      setError(`Properties for sale must be priced at KSh ${SALE_PRICE_MIN.toLocaleString()} or above.`);
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
      if (pin) {
        formData.append("latitude", String(pin.latitude));
        formData.append("longitude", String(pin.longitude));
        formData.append("address", pin.address);
        if (pin.placeId) formData.append("placeId", pin.placeId);
      } else {
        // No pin currently set in the form (either never set, or explicitly cleared) —
        // tell the server so it can null out any previously-saved location.
        formData.append("clearLocation", "true");
      }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p
        role="note"
        className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-gold)] bg-[var(--dk-gold-bg)] px-3.5 py-2.5 text-sm text-[var(--dk-gold-deep)]"
      >
        {PRIME_PROPERTY_NOTICE}
      </p>

      <div>
        <label className={fieldLabelClass}>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={TITLE_MIN_LENGTH}
            maxLength={TITLE_MAX_LENGTH}
            required
            className={fieldInputClass}
          />
        </label>
      </div>

      <div>
        <label className={fieldLabelClass}>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            minLength={DESCRIPTION_MIN_LENGTH}
            maxLength={DESCRIPTION_MAX_LENGTH}
            required
            className={`${fieldInputClass} resize-y`}
          />
        </label>
      </div>

      <div>
        <label className={fieldLabelClass}>
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            minLength={LOCATION_MIN_LENGTH}
            required
            className={fieldInputClass}
          />
        </label>
      </div>

      <div>
        <LocationPicker value={pin} onChange={setPin} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-3.5 py-3">
        <p className="m-0 text-sm text-[var(--dk-ink)]">
          <strong className="text-[var(--dk-heading)]">Commission agreement:</strong>{" "}
          {property.commissionAgreedAt
            ? `${(property.commissionRate * 100).toFixed(
                (property.commissionRate * 100) % 1 === 0 ? 0 : 2
              )}% — agreed on ${new Date(property.commissionAgreedAt).toLocaleDateString()}`
            : "Not yet on record for this listing."}
        </p>
        {property.commissionAgreementText && (
          <p className="m-0 mt-1.5">
            <small className="text-xs text-[var(--dk-muted)]">{property.commissionAgreementText}</small>
          </p>
        )}
        {property.commissionAgreedAt && (
          <p className="m-0 mt-1.5">
            <a
              href={`/api/properties/${property.id}/commission-agreement`}
              className="text-sm font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)]"
            >
              Download signed certificate (PDF)
            </a>
          </p>
        )}
      </div>

      <div>
        <label className={fieldLabelClass}>
          Property type
          <select
            value={propertyType}
            onChange={(e) => handlePropertyTypeChange(e.target.value)}
            className={fieldInputClass}
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
        <div>
          <label className={fieldLabelClass}>
            Please specify property type
            <input
              value={propertyTypeOther}
              onChange={(e) => setPropertyTypeOther(e.target.value)}
              placeholder="e.g. Boathouse, Warehouse, Farm"
              list="property-type-suggestions"
              required
              className={fieldInputClass}
            />
            <datalist id="property-type-suggestions">
              {PROPERTY_TYPE_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </label>
        </div>
      )}

      <div>
        <label className={fieldLabelClass}>
          Listing type
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className={fieldInputClass}
          >
            <option value="SALE">For sale</option>
            <option value="RENT">For rent</option>
          </select>
        </label>
      </div>

      <div>
        <label className={fieldLabelClass}>
          Price (KSh)
          <input
            type="number"
            step="0.01"
            min={listingType === "SALE" ? SALE_PRICE_MIN : PRICE_MIN}
            max={PRICE_MAX}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className={fieldInputClass}
          />
          <small className="text-xs font-normal text-[var(--dk-muted)]">
            {listingType === "SALE"
              ? `Minimum KSh ${SALE_PRICE_MIN.toLocaleString()} for properties for sale — maximum KSh ${PRICE_MAX.toLocaleString()}`
              : `Minimum KSh ${PRICE_MIN.toLocaleString()} — maximum KSh ${PRICE_MAX.toLocaleString()}`}
          </small>
        </label>
      </div>

      {(fields.bedrooms || fields.bathrooms || fields.acreage) && (
        <div className="flex flex-wrap gap-4">
          {fields.bedrooms && (
            <div className="min-w-[140px] flex-1">
              <label className={fieldLabelClass}>
                Bedrooms (optional)
                <input
                  type="number"
                  min="0"
                  max={BEDROOMS_MAX}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className={fieldInputClass}
                />
              </label>
            </div>
          )}

          {fields.bathrooms && (
            <div className="min-w-[140px] flex-1">
              <label className={fieldLabelClass}>
                Bathrooms (optional)
                <input
                  type="number"
                  min="0"
                  max={BATHROOMS_MAX}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className={fieldInputClass}
                />
              </label>
            </div>
          )}

          {fields.acreage && (
            <div className="min-w-[140px] flex-1">
              <label className={fieldLabelClass}>
                {fields.acreageLabel}
                {!fields.acreageRequired && " (optional)"}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={ACREAGE_MAX}
                  value={acreage}
                  onChange={(e) => setAcreage(e.target.value)}
                  required={fields.acreageRequired}
                  className={fieldInputClass}
                />
              </label>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {property.imageUrl && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--dk-ink)]">Current photo:</span>
            <img
              src={property.imageUrl}
              alt="Current listing photo"
              width={240}
              className="rounded-[var(--radius-md)] border border-[var(--dk-border)] object-cover"
            />
          </div>
        )}
        <label className={fieldLabelClass}>
          {property.imageUrl ? "Replace photo (optional)" : "Photo"}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={!property.imageUrl}
            className={`${fieldInputClass} file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--dk-ivory)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--dk-primary)]`}
          />
          {!property.imageUrl && (
            <small className="text-xs font-normal text-[var(--dk-muted)]">
              Required — JPEG, PNG, or WEBP, max 5MB.
            </small>
          )}
        </label>
      </div>

      {isAgent && (
        <>
          <div>
            <label className={fieldLabelClass}>
              Representing (owner&apos;s name)
              <input
                value={representingName}
                onChange={(e) => setRepresentingName(e.target.value)}
                placeholder="Who you're selling this on behalf of"
                required
                className={fieldInputClass}
              />
            </label>
          </div>
          <div>
            <label className={fieldLabelClass}>
              Owner&apos;s contact (optional)
              <input
                value={representingContact}
                onChange={(e) => setRepresentingContact(e.target.value)}
                placeholder="Phone or email"
                className={fieldInputClass}
              />
            </label>
          </div>
        </>
      )}

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
        className="inline-flex w-fit items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save and resubmit for review"}
      </button>
    </form>
  );
}