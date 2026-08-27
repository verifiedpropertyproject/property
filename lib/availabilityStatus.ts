// Availability status: the lister's (or an admin's) day-to-day "is this still on the market"
// flag for a listing (see Property.availabilityStatus in prisma/schema.prisma). Separate from
// Property.status, which is the admin review/publish workflow — changing availability never
// affects whether the listing is public.
//
// Centralised here so every place that shows or edits this field (homepage cards, the listing
// detail page, the dashboard, the admin list, and the update form) agrees on the same labels,
// options, and colors — a status change made in one place is guaranteed to look the same
// wherever else it's reflected.

export const AVAILABILITY_STATUSES = ["AVAILABLE", "RESERVED", "SOLD", "RENTED"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
};

export function getAvailabilityLabel(status: string): string {
  return AVAILABILITY_LABELS[status] || status;
}

// Tailwind classes for a small pill/badge, keyed by status — green for still-available, amber
// for reserved (in progress), and a stronger tone for the two "gone" states so it reads as final
// at a glance on cards, the detail page, and admin/dashboard lists alike.
export const AVAILABILITY_BADGE_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  RESERVED: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  SOLD: "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
  RENTED: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
};

export function getAvailabilityBadgeClass(status: string): string {
  return (
    AVAILABILITY_BADGE_STYLES[status] ||
    "bg-gray-50 text-gray-800 ring-1 ring-gray-200"
  );
}

// Statuses under which a listing is considered no longer actively on the market — used to gate
// new enquiries and to show a "closed" ribbon over the listing's photo.
export const CLOSED_AVAILABILITY_STATUSES: readonly string[] = ["SOLD", "RENTED"];

export function isClosedAvailability(status: string): boolean {
  return CLOSED_AVAILABILITY_STATUSES.includes(status);
}
