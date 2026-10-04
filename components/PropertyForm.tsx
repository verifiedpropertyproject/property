"use client";

import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { uploadPropertyMedia } from "@/lib/clientBlobUpload";
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
  IMAGE_MAX_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  VIDEO_MAX_SIZE_BYTES,
  ALLOWED_VIDEO_MIME_TYPES,
  commissionAgreementText,
  getPropertyTypeFields,
} from "@/lib/propertyConstants";
import { canRequestIdentityVerification } from "@/lib/identityVerification";
import { RESALE_CATEGORIES, getResaleCategoryLabel } from "@/lib/resaleCategory";

const fieldInputClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm font-normal text-[var(--dk-ink)] outline-none transition-colors duration-150 placeholder:text-[var(--dk-placeholder)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]";

const fieldLabelClass = "flex flex-col gap-1.5 text-sm font-medium text-[var(--dk-ink)]";

const checkboxRowClass = "flex items-start gap-2 text-sm text-[var(--dk-ink)]";
const checkboxInputClass = "mt-0.5 h-4 w-4 shrink-0 accent-[var(--dk-primary)]";

export default function PropertyForm({
  isAgent,
  identityVerificationStatus,
  hideIdentityVerificationOption = false,
  isAdminListing = false,
  submitLabel = "Submit for review",
  submittingLabel = "Submitting...",
}: {
  isAgent: boolean;
  identityVerificationStatus: string;
  // Set for admin usage of this form: identity verification is an OWNER/AGENT-only concept,
  // so hide the "also request identity verification" checkbox rather than show it against an
  // admin's own (irrelevant) status.
  hideIdentityVerificationOption?: boolean;
  // Set when an admin/super admin is listing directly — surfaces the optional resale category
  // field (Auction / Standard Resale / Distressed Sale / Foreclosure), which never applies to an
  // Owner/Agent's own listing. See Property.resaleCategory in prisma/schema.prisma.
  isAdminListing?: boolean;
  // A super admin's listing skips the review queue (see app/api/properties/route.ts), so the
  // button copy shouldn't promise a review that never happens.
  submitLabel?: string;
  submittingLabel?: string;
}) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [galleryCount, setGalleryCount] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("HOUSE");
  const [propertyTypeOther, setPropertyTypeOther] = useState("");
  const [listingType, setListingType] = useState("SALE");
  const [resaleCategory, setResaleCategory] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [acreage, setAcreage] = useState("");
  const [representingName, setRepresentingName] = useState("");
  const [representingContact, setRepresentingContact] = useState("");
  const [pin, setPin] = useState<PickedLocation | null>(null);
  const [commissionAgreed, setCommissionAgreed] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [requestIdentityVerification, setRequestIdentityVerification] = useState(false);
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
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
      setError("You must state who you're representing (the property owner's name).");
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

    // Friendly size/type checks up front, so people hear about a too-big file right away rather
    // than after waiting on an upload.
    const coverFile = imageInputRef.current?.files?.[0];
    const extraPhotos = Array.from(galleryInputRef.current?.files ?? []);
    const tourVideo = videoInputRef.current?.files?.[0];
    for (const f of [coverFile, ...extraPhotos]) {
      if (!f) continue;
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(f.type)) {
        setError(`"${f.name}" isn't a JPEG, PNG, or WEBP photo.`);
        return;
      }
      if (f.size > IMAGE_MAX_SIZE_BYTES) {
        setError(`"${f.name}" is too large. Each photo can be at most ${IMAGE_MAX_SIZE_BYTES / (1024 * 1024)}MB.`);
        return;
      }
    }
    if (tourVideo) {
      if (!ALLOWED_VIDEO_MIME_TYPES.includes(tourVideo.type)) {
        setError("The video must be an MP4, WebM, or MOV file.");
        return;
      }
      if (tourVideo.size > VIDEO_MAX_SIZE_BYTES) {
        setError(`The video is too large. Max size is ${Math.round(VIDEO_MAX_SIZE_BYTES / (1024 * 1024))}MB.`);
        return;
      }
    }

    setLoading(true);

    try {
      // Photos and video go straight from the browser to Vercel Blob (our own API can't accept a
      // request over ~4.5MB on Vercel — that was the "413" error), and the listing request below
      // then carries only their URLs. If Blob isn't configured (local dev), uploadPropertyMedia
      // returns null and we fall back to posting the files in the form like before.
      const userId = (session?.user as { id?: string } | undefined)?.id;
      let coverUrl: string | null = null;
      let galleryUrls: string[] = [];
      let videoUrl: string | null = null;
      let uploadedDirect = false;

      if (userId && coverFile) {
        try {
          setUploadStatus("Uploading cover photo...");
          coverUrl = await uploadPropertyMedia(coverFile, userId);
          if (coverUrl) {
            uploadedDirect = true;
            for (let i = 0; i < extraPhotos.length; i++) {
              setUploadStatus(`Uploading photo ${i + 1} of ${extraPhotos.length}...`);
              const url = await uploadPropertyMedia(extraPhotos[i], userId);
              if (!url) throw new Error("Upload failed.");
              galleryUrls.push(url);
            }
            if (tourVideo) {
              setUploadStatus("Uploading video (this can take a minute)...");
              videoUrl = await uploadPropertyMedia(tourVideo, userId);
              if (!videoUrl) throw new Error("Upload failed.");
            }
          }
        } catch (uploadErr: any) {
          setError(
            `Couldn't upload your photos/video${uploadErr?.message ? ` (${uploadErr.message})` : ""}. Check your connection and try again.`
          );
          return;
        }
      }
      setUploadStatus(uploadedDirect ? "Saving listing..." : "");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("propertyType", propertyType);
      formData.append("propertyTypeOther", propertyTypeOther);
      formData.append("listingType", listingType);
      if (isAdminListing && resaleCategory) {
        formData.append("resaleCategory", resaleCategory);
      }
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
      if (uploadedDirect) {
        formData.append("imageUrl", coverUrl as string);
        for (const url of galleryUrls) formData.append("galleryImageUrls", url);
        if (videoUrl) formData.append("videoUrl", videoUrl);
      } else {
        if (coverFile) formData.append("image", coverFile);
        for (const file of extraPhotos) formData.append("galleryImages", file);
        if (tourVideo) formData.append("video", tourVideo);
      }
      formData.append("commissionAgreed", "true");
      formData.append("signedName", signedName.trim());
      if (requestIdentityVerification) {
        formData.append("requestIdentityVerification", "true");
      }

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
      setUploadStatus("");
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
            placeholder="e.g. Kitengela, Kajiado"
            minLength={LOCATION_MIN_LENGTH}
            required
            className={fieldInputClass}
          />
        </label>
      </div>

      <div>
        <LocationPicker value={pin} onChange={setPin} />
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

      {isAdminListing && (
        <div>
          <label className={fieldLabelClass}>
            Resale category (optional)
            <select
              value={resaleCategory}
              onChange={(e) => setResaleCategory(e.target.value)}
              className={fieldInputClass}
            >
              <option value="">— Not a resale property —</option>
              {RESALE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {getResaleCategoryLabel(category)}
                </option>
              ))}
            </select>
            <small className="text-xs font-normal text-[var(--dk-muted)]">
              Only applies to a resale property you&apos;re listing on the platform&apos;s behalf — leave
              this as-is if you&apos;re just onboarding an owner&apos;s own listing.
            </small>
          </label>
        </div>
      )}

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

      <div>
        <label className={fieldLabelClass}>
          Cover photo
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className={`${fieldInputClass} file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--dk-ivory)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--dk-primary)]`}
          />
          <small className="text-xs font-normal text-[var(--dk-muted)]">
            Required — JPEG, PNG, or WEBP, max 5MB. This is the photo shown on listing cards
            across the site.
          </small>
        </label>
      </div>

      <div>
        <label className={fieldLabelClass}>
          Additional photos (optional)
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => setGalleryCount(e.target.files?.length ?? 0)}
            className={`${fieldInputClass} file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--dk-ivory)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--dk-primary)]`}
          />
          <small className="text-xs font-normal text-[var(--dk-muted)]">
            Up to {MAX_GALLERY_IMAGES} more photos — JPEG, PNG, or WEBP, max 5MB each. These only
            show up when a buyer opens the full listing, not on listing cards.
          </small>
        </label>
      </div>

      <div>
        <label className={fieldLabelClass}>
          Walkthrough video (optional)
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className={`${fieldInputClass} file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--dk-ivory)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--dk-primary)]`}
          />
          <small className="text-xs font-normal text-[var(--dk-muted)]">
            MP4, WebM, or MOV, max {Math.round(VIDEO_MAX_SIZE_BYTES / (1024 * 1024))}MB. Shown on
            the full listing page. You can also add or replace this later from the edit page.
          </small>
        </label>
      </div>

      {!hideIdentityVerificationOption && canRequestIdentityVerification(identityVerificationStatus) && (
        <div className="rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-3.5 py-3">
          <label className={checkboxRowClass}>
            <input
              type="checkbox"
              checked={requestIdentityVerification}
              onChange={(e) => setRequestIdentityVerification(e.target.checked)}
              className={checkboxInputClass}
            />
            <span>
              {identityVerificationStatus === "REJECTED"
                ? "Also resubmit my identity verification request"
                : "Also request identity verification for my account"}
            </span>
          </label>
          <small className="mt-1.5 block text-xs text-[var(--dk-muted)]">
            An admin will review this alongside your listing. Once approved, it'll show on
            your listings as a trust signal. You can also request this any time from your
            dashboard.
          </small>
        </div>
      )}

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

      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-3.5 py-3.5">
        <p className="m-0">
          <small className="text-xs text-[var(--dk-muted)]">{commissionAgreementText(DEFAULT_COMMISSION_RATE)}</small>
        </p>
        <label className={fieldLabelClass}>
          Type your full legal name to sign
          <input
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            placeholder="Full legal name"
            className={fieldInputClass}
          />
        </label>
        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            checked={commissionAgreed}
            onChange={(e) => setCommissionAgreed(e.target.checked)}
            className={checkboxInputClass}
          />
          <span>
            I, the person named above, have read and agree to the commission terms above. This
            serves as my electronic signature.
          </span>
        </label>
      </div>

      {error && (
        <p className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-fit items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? uploadStatus || submittingLabel : submitLabel}
      </button>
    </form>
  );
}