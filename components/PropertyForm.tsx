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
  DEFAULT_COMMISSION_RATE,
  MAX_GALLERY_IMAGES,
  commissionAgreementText,
  getPropertyTypeFields,
} from "@/lib/propertyConstants";

export default function PropertyForm({ isAgent }: { isAgent: boolean }) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryCount, setGalleryCount] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("HOUSE");
  const [propertyTypeOther, setPropertyTypeOther] = useState("");
  const [listingType, setListingType] = useState("SALE");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [acreage, setAcreage] = useState("");
  const [representingName, setRepresentingName] = useState("");
  const [representingContact, setRepresentingContact] = useState("");
  const [pin, setPin] = useState<PickedLocation | null>(null);
  const [commissionAgreed, setCommissionAgreed] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    if (!imageInputRef.current?.files?.[0]) {
      setError("A photo is required for the listing.");
      return;
    }

    if (galleryCount > MAX_GALLERY_IMAGES) {
      setError(`You can upload at most ${MAX_GALLERY_IMAGES} additional photos.`);
      return;
    }

    if (!commissionAgreed) {
      setError("You must agree to the platform's commission terms to list a property.");
      return;
    }

    if (signedName.trim().length < 2) {
      setError("Please type your full legal name to sign the commission agreement.");
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
      }
      const imageFile = imageInputRef.current?.files?.[0];
      if (imageFile) {
        formData.append("image", imageFile);
      }
      const galleryFiles = galleryInputRef.current?.files;
      if (galleryFiles) {
        for (const file of Array.from(galleryFiles)) {
          formData.append("galleryImages", file);
        }
      }
      formData.append("commissionAgreed", "true");
      formData.append("signedName", signedName.trim());

      const res = await fetch("/api/properties", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to submit listing (status ${res.status}).`);
        return;
      }

      router.push(`/properties/${data.id}/documents`);
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p role="note">{PRIME_PROPERTY_NOTICE}</p>

      <div>
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={TITLE_MIN_LENGTH}
            maxLength={TITLE_MAX_LENGTH}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            minLength={DESCRIPTION_MIN_LENGTH}
            maxLength={DESCRIPTION_MAX_LENGTH}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Kitengela, Kajiado"
            minLength={LOCATION_MIN_LENGTH}
            required
          />
        </label>
      </div>

      <div>
        <LocationPicker value={pin} onChange={setPin} />
      </div>

      <div>
        <label>
          Property type
          <select
            value={propertyType}
            onChange={(e) => handlePropertyTypeChange(e.target.value)}
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
          <label>
            Please specify property type
            <input
              value={propertyTypeOther}
              onChange={(e) => setPropertyTypeOther(e.target.value)}
              placeholder="e.g. Boathouse, Warehouse, Farm"
              list="property-type-suggestions"
              required
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
        <label>
          Listing type
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
          >
            <option value="SALE">For sale</option>
            <option value="RENT">For rent</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Price (KSh)
          <input
            type="number"
            step="0.01"
            min={listingType === "SALE" ? SALE_PRICE_MIN : PRICE_MIN}
            max={PRICE_MAX}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <small>
            {listingType === "SALE"
              ? `Minimum KSh ${SALE_PRICE_MIN.toLocaleString()} for properties for sale — maximum KSh ${PRICE_MAX.toLocaleString()}`
              : `Minimum KSh ${PRICE_MIN.toLocaleString()} — maximum KSh ${PRICE_MAX.toLocaleString()}`}
          </small>
        </label>
      </div>

      {(fields.bedrooms || fields.bathrooms || fields.acreage) && (
        <div>
          {fields.bedrooms && (
            <div>
              <label>
                Bedrooms (optional)
                <input
                  type="number"
                  min="0"
                  max={BEDROOMS_MAX}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </label>
            </div>
          )}

          {fields.bathrooms && (
            <div>
              <label>
                Bathrooms (optional)
                <input
                  type="number"
                  min="0"
                  max={BATHROOMS_MAX}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </label>
            </div>
          )}

          {fields.acreage && (
            <div>
              <label>
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
                />
              </label>
            </div>
          )}
        </div>
      )}

      <div>
        <label>
          Cover photo
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
          <small>
            Required — JPEG, PNG, or WEBP, max 5MB. This is the photo shown on listing cards
            across the site.
          </small>
        </label>
      </div>

      <div>
        <label>
          Additional photos (optional)
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => setGalleryCount(e.target.files?.length ?? 0)}
          />
          <small>
            Up to {MAX_GALLERY_IMAGES} more photos — JPEG, PNG, or WEBP, max 5MB each. These only
            show up when a buyer opens the full listing, not on listing cards.
          </small>
        </label>
      </div>

      {isAgent && (
        <>
          <div>
            <label>
              Representing (owner&apos;s name)
              <input
                value={representingName}
                onChange={(e) => setRepresentingName(e.target.value)}
                placeholder="Who you're selling this on behalf of"
                required
              />
            </label>
          </div>
          <div>
            <label>
              Owner&apos;s contact (optional)
              <input
                value={representingContact}
                onChange={(e) => setRepresentingContact(e.target.value)}
                placeholder="Phone or email"
              />
            </label>
          </div>
        </>
      )}

      <div>
        <p>
          <small>{commissionAgreementText(DEFAULT_COMMISSION_RATE)}</small>
        </p>
        <label>
          Type your full legal name to sign
          <input
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            placeholder="Full legal name"
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={commissionAgreed}
            onChange={(e) => setCommissionAgreed(e.target.checked)}
          />
          {" "}I, the person named above, have read and agree to the commission terms above. This
          serves as my electronic signature.
        </label>
      </div>

      {error && (
        <p>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit for review"}
      </button>
    </form>
  );
}