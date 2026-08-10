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

export const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function getPropertyTypeLabel(propertyType: string, propertyTypeOther?: string | null) {
  if (propertyType === "OTHER") {
    return propertyTypeOther ? `Other (${propertyTypeOther})` : "Other";
  }
  return PROPERTY_TYPE_LABELS[propertyType] || propertyType;
}
