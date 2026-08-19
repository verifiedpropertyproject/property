"use client";

import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import LocationPicker, { type PickedLocation } from "@/components/LocationPicker";
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
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  placeId: string | null;
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
    <form onSubmit={handleSubmit}>
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
            onChange={(e) => setPropertyType(e.target.value)}
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
              required
            />
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
            min={PRICE_MIN}
            max={PRICE_MAX}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <small>
            Minimum KSh {PRICE_MIN.toLocaleString()} — maximum KSh {PRICE_MAX.toLocaleString()}
          </small>
        </label>
      </div>

      <div>
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

        <div>
          <label>
            Acreage (optional)
            <input
              type="number"
              step="0.01"
              min="0"
              max={ACREAGE_MAX}
              value={acreage}
              onChange={(e) => setAcreage(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div>
        {property.imageUrl && (
          <div>
            <span>Current photo:</span>
            <img
              src={property.imageUrl}
              alt="Current listing photo"
              width={240}
            />
          </div>
        )}
        <label>
          {property.imageUrl ? "Replace photo (optional)" : "Photo"}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={!property.imageUrl}
          />
          {!property.imageUrl && (
            <small>
              Required — JPEG, PNG, or WEBP, max 5MB.
            </small>
          )}
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
        {loading ? "Saving..." : "Save and resubmit for review"}
      </button>
    </form>
  );
}