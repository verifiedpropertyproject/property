import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import NotificationBell from "@/components/NotificationBell";

import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
import { getIdentityVerificationLabel } from "@/lib/identityVerification";
import {
  AVAILABILITY_LABELS,
  getAvailabilityBadgeClass,
  isClosedAvailability,
} from "@/lib/availabilityStatus";
import BuySellCard from "@/components/BuySellCard";
import ThemeToggle from "@/components/ThemeToggle";
import PremiumSelect from "./PremiumSelect";

type PropertyWithSeller = Property & {
  seller: Pick<User, "name" | "email" | "role" | "phone" | "verified" | "createdAt" | "identityVerificationStatus">;
};

type SearchParams = {
  q?: string;
  location?: string;
  propertyType?: string;
  listingType?: string;
  availabilityStatus?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

const LISTING_TYPE_OPTIONS = [
  { value: "SALE", label: "For sale" },
  { value: "RENT", label: "For rent" },
];

const AVAILABILITY_OPTIONS = Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label }));

const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPES.map((t) => ({ value: t, label: PROPERTY_TYPE_LABELS[t] }));

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const SORT_ORDER_BY: Record<string, Prisma.PropertyOrderByWithRelationInput[]> = {
  newest: [{ featured: "desc" }, { createdAt: "desc" }],
  oldest: [{ featured: "desc" }, { createdAt: "asc" }],
  price_asc: [{ featured: "desc" }, { price: "asc" }],
  price_desc: [{ featured: "desc" }, { price: "desc" }],
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

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);

  const where: Prisma.PropertyWhereInput = { status: "APPROVED", seller: { suspended: false } };

  if (searchParams.q) {
    const q = searchParams.q.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { propertyType: { contains: q, mode: "insensitive" } },
        { propertyTypeOther: { contains: q, mode: "insensitive" } },
        { listingType: { contains: q, mode: "insensitive" } },
        { availabilityStatus: { contains: q, mode: "insensitive" } },
        { representingName: { contains: q, mode: "insensitive" } },
        { seller: { name: { contains: q, mode: "insensitive" } } },
        { seller: { email: { contains: q, mode: "insensitive" } } },
      ];
    }
  }

  if (searchParams.location) {
    where.location = { contains: searchParams.location, mode: "insensitive" };
  }
  if (searchParams.propertyType) {
    where.propertyType = searchParams.propertyType;
  }
  if (searchParams.listingType) {
    where.listingType = searchParams.listingType;
  }
  if (searchParams.availabilityStatus) {
    where.availabilityStatus = searchParams.availabilityStatus;
  }
  if (searchParams.minPrice || searchParams.maxPrice) {
    const min = Number(searchParams.minPrice);
    const max = Number(searchParams.maxPrice);
    where.price = {};
    if (searchParams.minPrice && !Number.isNaN(min)) where.price.gte = min;
    if (searchParams.maxPrice && !Number.isNaN(max)) where.price.lte = max;
  }

  const sort = searchParams.sort && SORT_ORDER_BY[searchParams.sort] ? searchParams.sort : "newest";

  const properties = await prisma.property.findMany({
    where,
    include: {
      seller: {
        select: {
          name: true,
          email: true,
          role: true,
          phone: true,
          verified: true,
          createdAt: true,
          identityVerificationStatus: true,
        },
      },
    },
    orderBy: SORT_ORDER_BY[sort],
  });

  // Per-seller track record (active listing count) shown on each card alongside the seller's
  // name — one grouped query for the whole page rather than one count query per listing.
  const sellerListingCounts = await prisma.property.groupBy({
    by: ["sellerId"],
    where: { status: "APPROVED", seller: { suspended: false } },
    _count: { _all: true },
  });
  const listingCountBySellerId = new Map(sellerListingCounts.map((row) => [row.sellerId, row._count._all]));

  // So each listing's Save button can show the correct initial state without a client-side fetch
  let savedPropertyIds = new Set<string>();
  if (session?.user?.role === "BUYER") {
    const saved = await prisma.savedProperty.findMany({
      where: { buyerId: session.user.id },
      select: { propertyId: true },
    });
    savedPropertyIds = new Set(saved.map((s: { propertyId: string }) => s.propertyId));
  }

  return (
    <div className="dk-page">
      {/* ==========================================================================
          Palette: forest green (action / verified), warm ivory (surface / paper),
          brass gold (premium accent, the "seal"). Type: Fraunces display + Inter body.

          Add to your root layout <head> to load the real fonts:
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
         ========================================================================== */}
      <style>{`
        .dk-page {
          color-scheme: light;

          --dk-dark: #0b2e1f;
          --dk-heading: var(--dk-dark);
          --dk-primary: #1f7a4c;
          --dk-primary-hover: #176339;
          --dk-primary-ring: rgba(31, 122, 76, 0.18);
          --dk-ivory: #faf7f0;
          --dk-card: #ffffff;
          --dk-border: #e8e2d3;
          --dk-ink: #1c2420;
          --dk-muted: #6b6357;
          --dk-gold: #b9872f;
          --dk-gold-deep: #93691f;
          --dk-gold-bg: #fbf3e4;
          --dk-shadow: rgba(35, 28, 14, 0.08);
          --dk-shadow-strong: rgba(35, 28, 14, 0.16);

          --font-display: "Fraunces", "Iowan Old Style", "Palatino Linotype", Georgia, serif;
          --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;

          --radius-sm: 7px;
          --radius-md: 11px;
          --radius-lg: 18px;

          background-color: var(--dk-card);
          color: var(--dk-ink);
          font-family: var(--font-body);
          overflow-x: hidden;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        /* ---------- Dark mode ----------
           Same tokens, repainted for a dark surface. --dk-dark stays a deep green
           (it's also the "Featured" badge fill, which keeps white text on top of it),
           so headings/price use their own --dk-heading token instead of reusing it. */
        .dark .dk-page {
          color-scheme: dark;

          --dk-dark: #0e2e20;
          --dk-heading: #eef2ea;
          --dk-primary: #34a672;
          --dk-primary-hover: #46b881;
          --dk-primary-ring: rgba(52, 166, 114, 0.25);
          --dk-ivory: #16241c;
          --dk-card: #101a15;
          --dk-border: #24352b;
          --dk-ink: #e7eae4;
          --dk-muted: #92a096;
          --dk-gold: #d9a94a;
          --dk-gold-deep: #f0c479;
          --dk-gold-bg: rgba(217, 169, 74, 0.14);
          --dk-shadow: rgba(0, 0, 0, 0.35);
          --dk-shadow-strong: rgba(0, 0, 0, 0.55);
        }

        .dk-page * { box-sizing: border-box; }

        /* every interactive element gets ONE consistent green ring, never the
           browser default blue one, and never doubled up with it */
        .dk-page a, .dk-page button, .dk-page input, .dk-page select,
        .dk-page [role="button"], .dk-page [role="listbox"] {
          outline: none;
          -webkit-tap-highlight-color: transparent;
          accent-color: var(--dk-primary);
          caret-color: var(--dk-primary);
        }
        .dk-page a:focus-visible,
        .dk-page button:focus-visible,
        .dk-page [role="button"]:focus-visible {
          outline: 2px solid var(--dk-primary);
          outline-offset: 2px;
        }

        .dk-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(20px, 4vw, 48px);
        }

        @keyframes dkFadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dkFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dk-page *, .dk-page *::before, .dk-page *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }

        .dk-hero {
          display: flex;
          flex-wrap: wrap;
          gap: 32px;
          align-items: flex-start;
          margin-bottom: 8px;
          animation: dkFadeIn 0.5s ease both;
        }

        .dk-hero-intro { flex: 1 1 300px; min-width: 0; padding-top: 4px; }

        .dk-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--dk-gold-deep);
          margin-bottom: 16px;
        }
        .dk-kicker::before {
          content: "";
          width: 20px;
          height: 1px;
          background: var(--dk-gold);
        }

        .dk-heading {
          font-family: var(--font-display);
          font-weight: 600;
          font-optical-sizing: auto;
          color: var(--dk-heading);
          margin: 0 0 16px;
          font-size: clamp(28px, 3.4vw, 41px);
          line-height: 1.14;
          letter-spacing: -0.01em;
          word-break: break-word;
          max-width: 20ch;
        }

        .dk-lede {
          color: var(--dk-muted);
          margin: 0;
          line-height: 1.7;
          font-size: 15.5px;
          max-width: 42ch;
        }

        .dk-auth-row {
          margin-top: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14.5px;
        }

        .dk-auth-link {
          color: var(--dk-primary);
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .dk-auth-link:hover { color: var(--dk-primary-hover); border-color: currentColor; }

        .dk-auth-divider { color: var(--dk-border); }

        .dk-search-panel {
          flex: 2 1 560px;
          min-width: 0;
          width: 100%;
          background-color: var(--dk-ivory);
          border: 1px solid var(--dk-border);
          border-radius: var(--radius-lg);
          padding: clamp(22px, 3vw, 30px);
          box-shadow: 0 1px 2px var(--dk-shadow);
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .dk-theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border-radius: 999px;
          border: 1px solid var(--dk-border);
          background-color: var(--dk-ivory);
          color: var(--dk-gold-deep);
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
        }
        .dk-theme-toggle:hover { border-color: var(--dk-gold); transform: scale(1.05); }
        .dk-theme-toggle:active { transform: scale(0.95); }
        .dk-theme-toggle svg { width: 17px; height: 17px; }

        .dk-search-title {
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--dk-heading);
          margin: 0 0 8px;
          font-size: 19px;
        }

        .dk-search-rule {
          border: none;
          height: 1px;
          margin: 0 0 20px;
          background: linear-gradient(90deg, var(--dk-gold) 0%, transparent 40%);
          opacity: 0.6;
        }

        .dk-field-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 22px; }

        .dk-field { flex: 1 1 160px; min-width: 140px; display: flex; flex-direction: column; }

        .dk-field-label {
          color: var(--dk-ink);
          font-weight: 500;
          font-size: 12px;
          letter-spacing: 0.02em;
          margin-bottom: 7px;
        }

        .dk-input {
          padding: 11px 13px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--dk-border);
          width: 100%;
          background-color: var(--dk-card);
          color: var(--dk-ink);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dk-input::placeholder { color: #a39a89; }
        .dk-input:hover { border-color: #d8cfba; }
        .dk-input:focus {
          border-color: var(--dk-primary);
          box-shadow: 0 0 0 3px var(--dk-primary-ring);
        }

        /* ---------- custom select (PremiumSelect) ---------- */

        .dk-select { position: relative; }

        .dk-select-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 11px 13px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--dk-border);
          background-color: var(--dk-card);
          color: var(--dk-ink);
          font-family: var(--font-body);
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dk-select-trigger:hover { border-color: #d8cfba; }
        .dk-select-placeholder { color: #a39a89; }

        .dk-select-chevron {
          width: 11px;
          height: 11px;
          color: var(--dk-muted);
          flex-shrink: 0;
          transition: transform 0.25s ease, color 0.2s ease;
        }

        .dk-select-open .dk-select-trigger {
          border-color: var(--dk-primary);
          box-shadow: 0 0 0 3px var(--dk-primary-ring);
        }
        .dk-select-open .dk-select-chevron {
          transform: rotate(180deg);
          color: var(--dk-primary);
        }

        .dk-select-panel {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          margin: 0;
          padding: 6px;
          list-style: none;
          background: var(--dk-card);
          border: 1px solid var(--dk-border);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 36px var(--dk-shadow-strong);
          z-index: 30;
          max-height: 240px;
          overflow-y: auto;
          opacity: 0;
          transform: translateY(-6px) scale(0.98);
          transform-origin: top center;
          pointer-events: none;
          transition: opacity 0.16s ease, transform 0.16s ease;
        }
        .dk-select-open .dk-select-panel {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .dk-select-option {
          padding: 9px 11px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--dk-ink);
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .dk-select-option:hover { background-color: var(--dk-ivory); }
        .dk-select-option-active {
          background-color: var(--dk-gold-bg);
          color: var(--dk-gold-deep);
          font-weight: 600;
        }

        .dk-search-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; }

        .dk-submit-btn {
          background-color: var(--dk-primary);
          background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0));
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          padding: 13px 30px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15) inset, 0 4px 10px var(--dk-shadow);
          transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .dk-submit-btn:hover {
          background-color: var(--dk-primary-hover);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15) inset, 0 8px 18px rgba(31, 122, 76, 0.3);
        }
        .dk-submit-btn:active { transform: scale(0.97); }
        .dk-submit-btn:focus-visible { outline: 2px solid var(--dk-primary); outline-offset: 3px; }

        .dk-clear-link {
          color: var(--dk-muted);
          font-weight: 500;
          font-size: 13.5px;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .dk-clear-link:hover { color: var(--dk-primary); text-decoration: underline; }

        @media (max-width: 640px) {
          .dk-search-actions { flex-direction: column; align-items: stretch; }
          .dk-search-actions button, .dk-search-actions a { width: 100%; text-align: center; }
        }

        .dk-divider { border: none; border-top: 1px solid var(--dk-border); margin: 38px 0 32px; }

        .dk-listings-heading {
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--dk-heading);
          margin-bottom: 20px;
          font-size: 22px;
        }

        .dk-empty-state {
          color: var(--dk-muted);
          background: var(--dk-ivory);
          border: 1px dashed var(--dk-border);
          border-radius: var(--radius-md);
          padding: 28px;
          font-size: 14.5px;
        }

        .dk-grid {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 268px), 1fr));
          gap: 22px;
        }

        .dk-card {
          background-color: var(--dk-card);
          border: 1px solid var(--dk-border);
          border-radius: var(--radius-lg);
          padding: 14px;
          display: flex;
          flex-direction: column;
          min-width: 0;
          animation: dkFadeInUp 0.45s ease both;
          box-shadow: 0 1px 2px var(--dk-shadow);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.2s ease;
        }
        .dk-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 34px var(--dk-shadow-strong);
          border-color: #d8cfba;
        }

        .dk-card-img-wrap {
          overflow: hidden;
          border-radius: var(--radius-md);
          margin-bottom: 12px;
          display: block;
          background: var(--dk-ivory);
        }
        .dk-card-img { width: 100%; height: 168px; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .dk-card:hover .dk-card-img { transform: scale(1.06); }

        .dk-badge-row { margin-bottom: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }

        .dk-badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 5px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1.4;
        }
        .dk-badge-featured { background-color: var(--dk-dark); color: #ffffff; }
        .dk-badge-availability { background-color: var(--dk-ivory); color: var(--dk-primary); border: 1px solid var(--dk-border); }

        /* Signature element: a stamped, slightly-rotated "verified seal" with a
           dashed brass ring — reads as "this land has been notarized," which is
           the one thing this marketplace is actually selling. */
        .dk-seal {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: var(--dk-gold-bg);
          color: var(--dk-gold-deep);
          border: 1px dashed var(--dk-gold);
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 9px 3px 7px;
          border-radius: 999px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          transform: rotate(-2deg);
        }
        .dk-seal svg { width: 11px; height: 11px; flex-shrink: 0; }

        .dk-card-title {
          color: var(--dk-ink);
          font-size: 16px;
          font-weight: 600;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }
        .dk-card-title-link { text-decoration: none; }
        .dk-card:hover .dk-card-title { color: var(--dk-primary); }

        .dk-meta-row {
          margin: 7px 0;
          font-size: 12.5px;
          color: var(--dk-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dk-verified-tag { color: var(--dk-primary); font-weight: 600; }
        .dk-not-verified-tag { color: var(--dk-muted); font-weight: 600; }

        .dk-price-eyebrow {
          display: block;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--dk-gold-deep);
          margin-bottom: 2px;
        }

        .dk-price {
          color: var(--dk-heading);
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 20px;
          margin-bottom: 8px;
        }

        .dk-location-row {
          color: var(--dk-muted);
          font-size: 12.5px;
          margin-bottom: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dk-seller-info { color: var(--dk-muted); display: block; font-size: 12.5px; line-height: 1.5; overflow-wrap: break-word; }
        .dk-seller-verified { color: var(--dk-primary); }

        .dk-contact-info { color: var(--dk-ink); display: block; font-size: 12.5px; margin-top: 5px; font-weight: 500; }
        .dk-verification-link-wrap { margin-top: 8px; }
        .dk-verification-link { font-size: 12.5px; font-weight: 600; color: var(--dk-primary); text-decoration: underline; }

        .dk-save-wrap { margin-top: auto; padding-top: 12px; }
      `}</style>

      <div className="dk-container">
        {/* ---------- Hero: intro + search panel ---------- */}
        <div className="dk-hero">
          <header className="dk-hero-intro">
            <div className="flex items-center justify-between gap-3">
              <span className="dk-kicker">Verified property, East Africa</span>
              <ThemeToggle />
            </div>
            <h1 className="dk-heading">A trusted marketplace for verified properties</h1>
            <p className="dk-lede">
              Buy and sell land, homes and commercial property with verified ownership and professional due
              diligence.
            </p>

            {session?.user ? (
              <p className="dk-auth-row">
                <NotificationBell />
                <Link href="/dashboard" className="dk-auth-link">
                  Go to your dashboard
                </Link>
              </p>
            ) : (
              <p className="dk-auth-row">
                <Link href="/login" className="dk-auth-link">
                  Log in
                </Link>
                <span className="dk-auth-divider">|</span>
                <Link href="/register" className="dk-auth-link">
                  Create an account
                </Link>
              </p>
            )}
          </header>

          <section className="dk-search-panel">
            <h2 className="dk-search-title">Find a property</h2>
            <hr className="dk-search-rule" />

            <form method="get">
              <div className="dk-field-grid">
                <div className="dk-field" style={{ flexBasis: "100%" }}>
                  <label className="dk-field-label">Keyword search</label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchParams.q}
                    placeholder="Search titles, descriptions, location, seller and more"
                    className="dk-input"
                  />
                </div>

                <div className="dk-field">
                  <label className="dk-field-label">Location / County</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={searchParams.location}
                    placeholder="e.g. Kitengela"
                    className="dk-input"
                  />
                </div>

                <PremiumSelect
                  name="propertyType"
                  label="Property type"
                  options={PROPERTY_TYPE_OPTIONS}
                  defaultValue={searchParams.propertyType}
                  placeholder="Any type"
                />

                <PremiumSelect
                  name="listingType"
                  label="Buy or rent"
                  options={LISTING_TYPE_OPTIONS}
                  defaultValue={searchParams.listingType}
                  placeholder="Any"
                />

                <PremiumSelect
                  name="availabilityStatus"
                  label="Availability"
                  options={AVAILABILITY_OPTIONS}
                  defaultValue={searchParams.availabilityStatus}
                  placeholder="Any"
                />

                <div className="dk-field">
                  <label className="dk-field-label">Min price (KSh)</label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={searchParams.minPrice}
                    min="0"
                    placeholder="Any"
                    className="dk-input"
                  />
                </div>

                <div className="dk-field">
                  <label className="dk-field-label">Max price (KSh)</label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={searchParams.maxPrice}
                    min="0"
                    placeholder="Any"
                    className="dk-input"
                  />
                </div>

                <PremiumSelect
                  name="sort"
                  label="Sort by"
                  options={SORT_OPTIONS}
                  defaultValue={sort}
                  placeholder="Newest first"
                />
              </div>

              <div className="dk-search-actions">
                <button type="submit" className="dk-submit-btn">
                  Search properties
                </button>
                <a href="/" className="dk-clear-link">
                  Clear filters
                </a>
              </div>
            </form>
          </section>
        </div>

        <hr className="dk-divider" />

        {/* ---------- Listings ---------- */}
        <section>
          <h2 className="dk-listings-heading">Verified listings ({properties.length})</h2>

          {properties.length === 0 ? (
            <p className="dk-empty-state">No properties match your search. Try adjusting your filters.</p>
          ) : (
            <ul className="dk-grid">
              {properties.map((p: PropertyWithSeller, index: number) => (
                <li key={p.id} className="dk-card" style={{ animationDelay: `${Math.min(index, 10) * 0.06}s` }}>
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
                    Member since {p.seller.createdAt.getFullYear()} —{" "}
                    {listingCountBySellerId.get(p.sellerId) ?? 0} active listing
                    {(listingCountBySellerId.get(p.sellerId) ?? 0) === 1 ? "" : "s"}
                    {p.seller.identityVerificationStatus === "APPROVED" && (
                      <>
                        {" "}—{" "}
                        <span className="dk-seller-verified">
                          {getIdentityVerificationLabel(p.seller.identityVerificationStatus)}
                        </span>
                      </>
                    )}
                    {p.seller.identityVerificationStatus === "PENDING" && (
                      <> — {getIdentityVerificationLabel(p.seller.identityVerificationStatus)}</>
                    )}
                  </small>

                  {p.showContact && p.seller.phone && (
                    <small className="dk-contact-info">Contact: {p.seller.phone}</small>
                  )}

                  <div className="dk-verification-link-wrap">
                    <Link href={`/properties/${p.id}?verification=1#verification`} className="dk-verification-link">
                      View verification
                    </Link>
                  </div>

                  {session?.user?.role === "BUYER" && (
                    <div className="dk-save-wrap">
                      <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <BuySellCard session={session} />
      </div>
    </div>
  );
}
