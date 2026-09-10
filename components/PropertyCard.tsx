import Link from "next/link";
import type { Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import { getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
import { getIdentityVerificationLabel } from "@/lib/identityVerification";
import { AVAILABILITY_LABELS, getAvailabilityBadgeClass, isClosedAvailability } from "@/lib/availabilityStatus";
import { getResaleCategoryLabel, getResaleCategoryBadgeClass } from "@/lib/resaleCategory";

export type PropertyWithSeller = Property & {
  seller: Pick<User, "name" | "email" | "role" | "phone" | "verified" | "createdAt" | "identityVerificationStatus">;
};

function VerifiedSeal() {
  return (
    <span className="dk-seal">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 12.5l2 2 4-4.5M12 3l2.2 1.3 2.5-.2 1 2.3 2.1 1.4-.6 2.5.6 2.5-2.1 1.4-1 2.3-2.5-.2L12 18l-2.2-1.3-2.5.2-1-2.3-2.1-1.4.6-2.5-.6-2.5 2.1-1.4 1-2.3 2.5.2L12 3z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      Daktop Verified
    </span>
  );
}

export default function PropertyCard({
  p,
  index,
  showSaveButton,
  isSaved,
  listingCount,
}: {
  p: PropertyWithSeller;
  index: number;
  showSaveButton: boolean;
  isSaved: boolean;
  listingCount: number;
}) {
  return (
    <li className="dk-card" style={{ animationDelay: `${Math.min(index, 10) * 0.06}s` }}>
      {p.imageUrl && (
        <Link href={`/properties/${p.id}`} className="dk-card-img-wrap relative block">
          <img src={p.imageUrl} alt={p.title} className="dk-card-img" />
          {isClosedAvailability(p.availabilityStatus) && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60">
              <span className="rounded-md bg-white/95 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-gray-900 dark:bg-neutral-900/95 dark:text-neutral-50">
                {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
              </span>
            </span>
          )}
        </Link>
      )}

      <div className="dk-badge-row">
        {p.featured && <span className="dk-badge dk-badge-featured">Featured</span>}
        {p.daktopVerified && <VerifiedSeal />}
        {p.resaleCategory && (
          <span
            className={`dk-badge inline-block rounded-full ${getResaleCategoryBadgeClass(p.resaleCategory)}`}
          >
            {getResaleCategoryLabel(p.resaleCategory)}
          </span>
        )}
        <span
          className={`dk-badge dk-badge-availability inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getAvailabilityBadgeClass(
            p.availabilityStatus
          )}`}
        >
          {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
        </span>
      </div>

      <Link href={`/properties/${p.id}`} className="dk-card-title-link">
        <strong className="dk-card-title">{p.title}</strong>
      </Link>

      <div className="dk-meta-row">
        <span className={p.seller.verified ? "dk-verified-tag" : "dk-not-verified-tag"}>
          {p.verified ? "Verified" : "Not verified"}
        </span>{" "}
        — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} —{" "}
        {p.listingType === "SALE" ? "For sale" : "For rent"}
      </div>

      <span className="dk-price-eyebrow">Asking price</span>
      <div className="dk-price">KSh {p.price.toLocaleString()}</div>

      <div className="dk-location-row">
        {p.location}
        {p.bedrooms !== null && <> — {p.bedrooms} bed</>}
        {p.bathrooms !== null && <> — {p.bathrooms} bath</>}
        {p.acreage !== null && <> — {p.acreage} acres</>}
      </div>

      <small className="dk-seller-info">
        Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
        {p.seller.verified && <span className="dk-seller-verified"> — Verified {getRoleLabel(p.seller.role)}</span>}
        {p.representingName && <> — representing {p.representingName}</>}
        <br />
        Member since {p.seller.createdAt.getFullYear()} — {listingCount} active listing
        {listingCount === 1 ? "" : "s"}
        {p.seller.identityVerificationStatus === "APPROVED" && (
          <>
            {" "}
            —{" "}
            <span className="dk-seller-verified">
              {getIdentityVerificationLabel(p.seller.identityVerificationStatus)}
            </span>
          </>
        )}
        {p.seller.identityVerificationStatus === "PENDING" && (
          <> — {getIdentityVerificationLabel(p.seller.identityVerificationStatus)}</>
        )}
      </small>

      {p.showContact && p.seller.phone && <small className="dk-contact-info">Contact: {p.seller.phone}</small>}

      <div className="dk-verification-link-wrap">
        <Link href={`/properties/${p.id}?verification=1#verification`} className="dk-verification-link">
          View verification
        </Link>
      </div>

      {showSaveButton && (
        <div className="dk-save-wrap">
          <SaveButton propertyId={p.id} initiallySaved={isSaved} />
        </div>
      )}
    </li>
  );
}
