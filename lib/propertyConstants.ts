export const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "OTHER"] as const;

// Display labels for role values. The underlying role strings (BUYER/OWNER/AGENT/ADMIN) stay
// the same everywhere in the DB and logic (no migration needed) — this is only what's shown
// to people, kept in one place so it's never out of sync across the admin panel, registration,
// dashboard, and listing pages.
export const ROLE_LABELS: Record<string, string> = {
  BUYER: "Buyer",
  OWNER: "Seller (As Owner)",
  AGENT: "Seller (As Agent)",
  ADMIN: "Admin",
};

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role] || role;
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  LAND: "Land",
  COMMERCIAL: "Commercial",
  OTHER: "Other",
};

export const LISTING_TYPES = ["SALE", "RENT"] as const;

// Suggestions offered (via an HTML <datalist>) on the free-text "Please specify property type"
// field that appears when propertyType is "OTHER". Purely advisory — the field stays free text
// so nothing here is validated or enforced, it just steers listers toward consistent wording
// (e.g. "Studio Apartment" every time, instead of a dozen near-duplicate typo'd variants) so
// admins reviewing/searching listings see cleaner, more comparable values.
export const PROPERTY_TYPE_SUGGESTIONS = [
  // Residential
  "Apartment",
  "Studio Apartment",
  "Serviced Apartment",
  "Furnished Apartment",
  "Penthouse",
  "Duplex",
  "Triplex",
  "Villa",
  "Luxury Villa",
  "Townhouse",
  "Maisonette",
  "Bungalow",
  "Mansion",
  "Cottage",
  "Farmhouse",
  "Residential House",
  "Bedsitter",
  "Single Room",
  "Hostel",
  "Boarding House",
  "Gated Community House",
  "Container House",
  "Boathouse",
  // Commercial / business
  "Commercial Building",
  "Office",
  "Office Suite",
  "Co-working Space",
  "Shop",
  "Retail Space",
  "Showroom",
  "Warehouse",
  "Storage Unit",
  "Hotel",
  "Guesthouse",
  "Bed and Breakfast",
  "Restaurant/Bar Premises",
  "Petrol Station",
  "Mixed-Use Building",
  // Land
  "Residential Land",
  "Commercial Land",
  "Agricultural Land",
  "Industrial Land",
  "Beach Plot",
  "Ranch",
  "Farm",
  // Industrial / special-purpose
  "Factory",
  "Godown",
  "Workshop",
  "Parking Lot",
  "Event Space",
] as const;

// Which of the "detail" inputs (bedrooms/bathrooms/size) actually make sense for a given
// property type, and how the size field should be labeled/required for it. Drives both the
// form (which fields to show, per type) and the API (which submitted values to trust/keep —
// a LAND listing that sneaks a "bedrooms" value into the request still gets it dropped server
// side, since PROPERTY_TYPE_FIELDS is the single source of truth on both ends).
//
// - HOUSE/APARTMENT: bedrooms + bathrooms matter; plot size is a nice-to-have, not required.
// - LAND: no rooms at all — the only thing that matters is how much land it is, so acreage is
//   required rather than optional.
// - COMMERCIAL: no bedrooms, but bathrooms and floor/plot size are still relevant.
// - OTHER: unknown shape, so show everything and let the lister include what applies.
export const PROPERTY_TYPE_FIELDS: Record<
  string,
  { bedrooms: boolean; bathrooms: boolean; acreage: boolean; acreageRequired: boolean; acreageLabel: string }
> = {
  HOUSE: { bedrooms: true, bathrooms: true, acreage: true, acreageRequired: false, acreageLabel: "Plot size (acres)" },
  APARTMENT: { bedrooms: true, bathrooms: true, acreage: false, acreageRequired: false, acreageLabel: "Size (acres)" },
  LAND: { bedrooms: false, bathrooms: false, acreage: true, acreageRequired: true, acreageLabel: "Land size (acres)" },
  COMMERCIAL: { bedrooms: false, bathrooms: true, acreage: true, acreageRequired: false, acreageLabel: "Floor/plot size (acres)" },
  OTHER: { bedrooms: true, bathrooms: true, acreage: true, acreageRequired: false, acreageLabel: "Size (acres)" },
};

export function getPropertyTypeFields(propertyType: string) {
  return PROPERTY_TYPE_FIELDS[propertyType] || PROPERTY_TYPE_FIELDS.OTHER;
}

// Practical bounds so the form and the API actually stop nonsense input instead of just
// accepting anything — a listing for KSh 5 or 500 bedrooms is never real data.
export const PRICE_MIN = 10_000;
export const PRICE_MAX = 10_000_000_000;

// DAKTOP360 positions itself as a premium marketplace for Nairobi & Kiambu — this floor
// applies only to properties FOR SALE. Rentals (monthly rent, naturally far below any
// property-value threshold) are exempt and still only bound by the general PRICE_MIN above.
export const SALE_PRICE_MIN = 7_000_000;

export const PRIME_PROPERTY_NOTICE =
  "DAKTOP360 is a premium property listing platform focused on properties in prime areas of " +
  "Nairobi & Kiambu, worth KSh 10M and above. Properties that don't meet this criteria might " +
  "not be approved.";


export const BEDROOMS_MAX = 50;
export const BATHROOMS_MAX = 50;
export const ACREAGE_MAX = 100_000;

export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 150;
export const DESCRIPTION_MIN_LENGTH = 20;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const LOCATION_MIN_LENGTH = 3;

// Where the map picker centers when a listing has no pin yet. Nairobi, since that's where
// this app's listings are concentrated — just a starting viewport, not a validation bound.
export const DEFAULT_MAP_CENTER = { lat: -1.286389, lng: 36.817223 };
export const DEFAULT_MAP_ZOOM = 7;
export const PICKED_MAP_ZOOM = 15;

export const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// A single optional walkthrough video per listing (separate from the photo gallery above).
// Kept generous but bounded — a full property tour, not an unlimited media dump.
export const VIDEO_MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// Beyond the one required cover photo, how many extra gallery photos a listing can have —
// generous enough for a real walkthrough of a property, bounded so nobody can dump hundreds of
// files into a single listing's storage.
export const MAX_GALLERY_IMAGES = 12;

// The wording shown to a seller/agent when they list a property, and the exact string
// snapshotted into Property.commissionAgreementText when they accept it. Keeping this as a
// function of the rate (rather than a fixed string) means it always describes whatever rate a
// particular listing was agreed at, including if an admin later changes DEFAULT_COMMISSION_RATE
// for new listings — past agreements keep reading correctly since they store their own snapshot.
export const DEFAULT_COMMISSION_RATE = 0.03;

// Bump this if the agreement wording below ever changes materially — each signed
// CommissionAgreement row snapshots the version it was shown, so historical certificates keep
// reading correctly regardless of later wording changes.
export const COMMISSION_AGREEMENT_VERSION = 1;

export function commissionAgreementText(rate: number): string {
  const pct = (rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 2);
  return `By listing this property, I agree that if it sells through this platform, the platform retains a commission of ${pct}% of the final sale price. This is a legal agreement between the lister and the platform and does not involve any payment processing by the platform.`;
}

export function getPropertyTypeLabel(propertyType: string, propertyTypeOther?: string | null) {
  if (propertyType === "OTHER") {
    return propertyTypeOther ? `Other (${propertyTypeOther})` : "Other";
  }
  return PROPERTY_TYPE_LABELS[propertyType] || propertyType;
}
