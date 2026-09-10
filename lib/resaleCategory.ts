// Resale category: an optional badge on a property listed directly by an admin (a resale
// property the platform itself is listing, as opposed to an Owner/Agent's own listing — see
// Property.resaleCategory in prisma/schema.prisma). Left null/unset for every Owner/Agent
// listing, and optional even on an admin's own listing since not every admin-listed property is
// a resale one.
//
// Centralised here so every place that shows or edits this field (homepage cards, the listing
// detail page, the dashboard "your listings" section, and the admin list) agrees on the same
// labels, options, and colors.

export const RESALE_CATEGORIES = ["AUCTION", "STANDARD_RESALE", "DISTRESSED_SALE", "FORECLOSURE"] as const;
export type ResaleCategory = (typeof RESALE_CATEGORIES)[number];

export const RESALE_CATEGORY_LABELS: Record<string, string> = {
  AUCTION: "Auction",
  STANDARD_RESALE: "Standard Resale",
  DISTRESSED_SALE: "Distressed Sale",
  FORECLOSURE: "Foreclosure",
};

export function getResaleCategoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  return RESALE_CATEGORY_LABELS[category] || category;
}

// Tailwind classes for a small pill/badge, keyed by category — kept visually distinct from the
// availability badges so the two aren't confused on a crowded card.
export const RESALE_CATEGORY_BADGE_STYLES: Record<string, string> = {
  AUCTION:
    "bg-orange-50 text-orange-800 ring-1 ring-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/30",
  STANDARD_RESALE:
    "bg-sky-50 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/30",
  DISTRESSED_SALE:
    "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/30",
  FORECLOSURE:
    "bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/30",
};

export function getResaleCategoryBadgeClass(category: string): string {
  return (
    RESALE_CATEGORY_BADGE_STYLES[category] ||
    "bg-gray-50 text-gray-800 ring-1 ring-gray-200 dark:bg-gray-400/10 dark:text-gray-300 dark:ring-gray-400/30"
  );
}
