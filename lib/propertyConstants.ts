export const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "OTHER"] as const;

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  LAND: "Land",
  COMMERCIAL: "Commercial",
  OTHER: "Other",
};

export const LISTING_TYPES = ["SALE", "RENT"] as const;

// Practical bounds so the form and the API actually stop nonsense input instead of just
// accepting anything — a listing for KSh 5 or 500 bedrooms is never real data.
export const PRICE_MIN = 10_000;
export const PRICE_MAX = 10_000_000_000;

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

// The wording shown to a seller/agent when they list a property, and the exact string
// snapshotted into Property.commissionAgreementText when they accept it. Keeping this as a
// function of the rate (rather than a fixed string) means it always describes whatever rate a
// particular listing was agreed at, including if an admin later changes DEFAULT_COMMISSION_RATE
// for new listings — past agreements keep reading correctly since they store their own snapshot.
export const DEFAULT_COMMISSION_RATE = 0.03;

export function commissionAgreementText(rate: number): string {
  const pct = (rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 2);
  return `By listing this property, I agree that if it sells through this platform, the platform retains a commission of ${pct}% of the final sale price. This is a legal agreement between the lister and the platform and does not involve any payment processing by the platform.`;
}
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function getPropertyTypeLabel(propertyType: string, propertyTypeOther?: string | null) {
  if (propertyType === "OTHER") {
    return propertyTypeOther ? `Other (${propertyTypeOther})` : "Other";
  }
  return PROPERTY_TYPE_LABELS[propertyType] || propertyType;
}
