import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import NotificationBell from "@/components/NotificationBell";
import {
  Search,
  MapPin,
  Building2,
  Wallet,
  SlidersHorizontal,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  Lock,
  Headphones,
  BedDouble,
  Bath,
  Maximize,
  ArrowRight,
  Home as HomeIcon,
  KeyRound,
  Trees,
  Store,
  Users,
} from "lucide-react";

import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
import BuySellCard from "@/components/BuySellCard";
import PremiumSelect from "./PremiumSelect";

type PropertyWithSeller = Property & { seller: Pick<User, "name" | "email" | "role" | "phone" | "verified"> };

type SearchParams = {
  location?: string;
  propertyType?: string;
  listingType?: string;
  availabilityStatus?: string;
  minPrice?: string;
  maxPrice?: string;
};

const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
};

const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPES.map((t) => ({ value: t, label: PROPERTY_TYPE_LABELS[t] }));

const MAX_PRICE_OPTIONS = [
  { value: "5000000", label: "Up to KSh 5M" },
  { value: "15000000", label: "Up to KSh 15M" },
  { value: "30000000", label: "Up to KSh 30M" },
  { value: "75000000", label: "Up to KSh 75M" },
  { value: "150000000", label: "Up to KSh 150M" },
];

const STATS = [
  { icon: HomeIcon, value: "10K+", label: "Properties Listed" },
  { icon: FileCheck2, value: "5K+", label: "Verified Titles" },
  { icon: Users, value: "3K+", label: "Happy Clients" },
  { icon: MapPin, value: "15+", label: "Counties Covered" },
];

const FEATURE_STRIP = [
  { icon: ShieldCheck, title: "Verified Listings", subtitle: "All properties vetted" },
  { icon: FileCheck2, title: "Title Verification", subtitle: "Secure & reliable" },
  { icon: Sparkles, title: "AI Property Valuation", subtitle: "Get accurate value" },
  { icon: Lock, title: "Secure Transactions", subtitle: "Safe & transparent" },
  { icon: Headphones, title: "Expert Support", subtitle: "We are here to help" },
];

// Quick-filter tabs. "Buy"/"Rent" set listingType; "Land"/"Commercial" set
// propertyType — confirm these values match your Prisma enums exactly.
const SEARCH_TABS = [
  { key: "buy", label: "Buy", icon: HomeIcon, param: "listingType", value: "SALE" },
  { key: "rent", label: "Rent", icon: KeyRound, param: "listingType", value: "RENT" },
  { key: "land", label: "Land", icon: Trees, param: "propertyType", value: "LAND" },
  { key: "commercial", label: "Commercial", icon: Store, param: "propertyType", value: "COMMERCIAL" },
];

function buildTabHref(tab: (typeof SEARCH_TABS)[number], current: SearchParams) {
  const params = new URLSearchParams();
  if (current.location) params.set("location", current.location);
  params.set(tab.param, tab.value);
  return `/?${params.toString()}`;
}

function isTabActive(tab: (typeof SEARCH_TABS)[number], current: SearchParams) {
  return current[tab.param as keyof SearchParams] === tab.value;
}

function VerifiedSeal() {
  return (
    <span className="dk-seal">
      <ShieldCheck size={12} strokeWidth={2.2} />
      Daktop Verified
    </span>
  );
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);

  const where: Prisma.PropertyWhereInput = { status: "APPROVED", seller: { suspended: false } };

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

  const properties = await prisma.property.findMany({
    where,
    include: { seller: { select: { name: true, email: true, role: true, phone: true, verified: true } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

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
          Palette pulled from the DAKTOP360 brand: deep forest green + brass gold,
          on a white page. This assumes your site header/nav and footer already
          live in a shared layout.tsx — this file covers hero → search → features
          → listings → sidebar only.

          Icons: lucide-react. Run `npm install lucide-react` if it's not already
          a dependency.

          Hero photo: swap the background-image url below for your own asset
          (e.g. put a file at /public/hero-real-estate.jpg and reference
          "/hero-real-estate.jpg"). Until then it falls back to a plain gradient.

          Fonts — add to your root layout <head> if you want the display serif:
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
         ========================================================================== */}
      <style>{`
        .dk-page {
          --dk-dark: #0b3d2e;
          --dk-dark-2: #0e4636;
          --dk-primary: #1f7a4c;
          --dk-primary-hover: #176339;
          --dk-primary-ring: rgba(31, 122, 76, 0.18);
          --dk-gold: #c99a3d;
          --dk-gold-deep: #93691f;
          --dk-gold-bg: #fbf3e4;
          --dk-ivory: #faf7f0;
          --dk-card: #ffffff;
          --dk-border: #e8e2d3;
          --dk-ink: #16211b;
          --dk-muted: #667369;
          --dk-shadow: rgba(11, 61, 46, 0.08);
          --dk-shadow-strong: rgba(11, 61, 46, 0.18);

          --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
          --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;

          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 18px;

          background-color: var(--dk-card);
          color: var(--dk-ink);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .dk-page * { box-sizing: border-box; }

        .dk-page a, .dk-page button, .dk-page input, .dk-page select, .dk-page [role="button"] {
          outline: none;
          -webkit-tap-highlight-color: transparent;
          accent-color: var(--dk-primary);
          caret-color: var(--dk-primary);
        }
        .dk-page a:focus-visible,
        .dk-page button:focus-visible,
        .dk-page [role="button"]:focus-visible {
          outline: 2px solid var(--dk-gold);
          outline-offset: 2px;
        }

        .dk-container { width: 100%; max-width: 1320px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 40px); }

        @keyframes dkFadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dkFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .dk-page *, .dk-page *::before, .dk-page *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }

        /* ---------- hero ---------- */

        .dk-hero {
          position: relative;
          min-height: 420px;
          display: flex;
          align-items: center;
          background-image: linear-gradient(100deg, rgba(6,26,19,0.88) 8%, rgba(6,26,19,0.35) 48%, rgba(6,26,19,0.05) 72%),
            url("/hero-real-estate.jpg");
          background-size: cover;
          background-position: center;
          background-color: var(--dk-dark);
          animation: dkFadeIn 0.5s ease both;
        }

        .dk-hero-inner { padding: 56px 0 120px; max-width: 620px; }

        .dk-eyebrow {
          font-family: var(--font-display);
          font-weight: 600;
          color: #ffffff;
          font-size: clamp(20px, 2.4vw, 26px);
          margin: 0 0 2px;
          line-height: 1.3;
        }

        .dk-heading {
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--dk-gold);
          margin: 0 0 16px;
          font-size: clamp(26px, 3.6vw, 38px);
          line-height: 1.15;
        }

        .dk-lede { color: rgba(255,255,255,0.88); margin: 0 0 28px; line-height: 1.65; font-size: 15.5px; max-width: 46ch; }

        .dk-stats { display: flex; flex-wrap: wrap; gap: 28px; }

        .dk-stat { display: flex; align-items: center; gap: 10px; }

        .dk-stat-icon {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.12);
          color: var(--dk-gold);
          flex-shrink: 0;
        }

        .dk-stat-value { color: #ffffff; font-weight: 700; font-size: 16px; line-height: 1.2; display: block; }
        .dk-stat-label { color: rgba(255,255,255,0.75); font-size: 11.5px; line-height: 1.2; }

        /* ---------- search + feature panel, overlaps hero ---------- */

        .dk-search-wrap { margin-top: -72px; position: relative; z-index: 5; margin-bottom: 8px; }

        .dk-search-panel {
          background: var(--dk-dark);
          border-radius: var(--radius-lg);
          box-shadow: 0 24px 48px var(--dk-shadow-strong);
          overflow: hidden;
        }

        .dk-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding: 14px 18px 0; }

        .dk-tab {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px;
          border-radius: 8px 8px 0 0;
          color: rgba(255,255,255,0.7);
          font-size: 13.5px;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .dk-tab:hover { color: #ffffff; }
        .dk-tab-active { background: var(--dk-primary); color: #ffffff; }

        .dk-search-fields {
          display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px;
          padding: 16px 18px 20px;
        }

        .dk-search-text {
          flex: 2 1 240px;
          min-width: 200px;
          position: relative;
        }
        .dk-search-text svg {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--dk-muted);
          pointer-events: none;
        }
        .dk-search-text input {
          width: 100%;
          padding: 13px 14px 13px 40px;
          border-radius: var(--radius-sm);
          border: none;
          background: #ffffff;
          color: var(--dk-ink);
          font-family: var(--font-body);
          font-size: 14px;
        }
        .dk-search-text input::placeholder { color: #98a39c; }
        .dk-search-text input:focus { box-shadow: 0 0 0 3px rgba(255,255,255,0.25); }

        .dk-field { flex: 1 1 160px; min-width: 150px; display: flex; flex-direction: column; }
        .dk-field-label { display: none; }

        /* ---------- custom select (PremiumSelect), styled as a white pill ---------- */

        .dk-select { position: relative; }

        .dk-select-trigger {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 13px 14px;
          border-radius: var(--radius-sm);
          border: none;
          background-color: #ffffff;
          color: var(--dk-ink);
          font-family: var(--font-body);
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          transition: box-shadow 0.2s ease;
        }
        .dk-select-trigger-inner { display: flex; align-items: center; gap: 9px; min-width: 0; overflow: hidden; }
        .dk-select-trigger-inner span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dk-select-icon { color: var(--dk-muted); display: flex; flex-shrink: 0; }
        .dk-select-placeholder { color: #98a39c; }

        .dk-select-chevron { color: var(--dk-muted); flex-shrink: 0; transition: transform 0.25s ease, color 0.2s ease; }

        .dk-select-open .dk-select-trigger { box-shadow: 0 0 0 3px rgba(255,255,255,0.35); }
        .dk-select-open .dk-select-chevron { transform: rotate(180deg); color: var(--dk-primary); }

        .dk-select-panel {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0;
          margin: 0; padding: 6px; list-style: none;
          background: var(--dk-card);
          border: 1px solid var(--dk-border);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 36px var(--dk-shadow-strong);
          z-index: 30;
          max-height: 260px; overflow-y: auto;
          opacity: 0; transform: translateY(-6px) scale(0.98); transform-origin: top center;
          pointer-events: none;
          transition: opacity 0.16s ease, transform 0.16s ease;
        }
        .dk-select-open .dk-select-panel { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

        .dk-select-option {
          padding: 9px 11px; border-radius: 7px; font-size: 14px; color: var(--dk-ink);
          cursor: pointer; transition: background-color 0.15s ease, color 0.15s ease;
        }
        .dk-select-option:hover { background-color: var(--dk-ivory); }
        .dk-select-option-active { background-color: var(--dk-gold-bg); color: var(--dk-gold-deep); font-weight: 600; }

        .dk-search-submit {
          display: inline-flex; align-items: center; gap: 8px;
          background-color: var(--dk-gold);
          background-image: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0));
          color: #2a1f08;
          border: none;
          border-radius: var(--radius-sm);
          padding: 13px 22px;
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 1px 0 rgba(255,255,255,0.3) inset, 0 6px 16px rgba(0,0,0,0.22);
          transition: filter 0.2s ease, transform 0.15s ease;
        }
        .dk-search-submit:hover { filter: brightness(1.06); }
        .dk-search-submit:active { transform: scale(0.97); }

        .dk-advanced-link {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.75);
          font-size: 13px; font-weight: 500; text-decoration: none;
          transition: color 0.2s ease;
        }
        .dk-advanced-link:hover { color: #ffffff; }

        .dk-feature-strip {
          background: var(--dk-dark-2);
          border-top: 1px solid rgba(255,255,255,0.08);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 18px;
          padding: 18px 22px;
        }

        .dk-feature {
          display: flex; align-items: center; gap: 10px;
        }
        .dk-feature-icon {
          width: 34px; height: 34px; border-radius: 50%;
          border: 1px solid var(--dk-gold);
          color: var(--dk-gold);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dk-feature-title { color: #ffffff; font-size: 13px; font-weight: 600; line-height: 1.3; }
        .dk-feature-subtitle { color: rgba(255,255,255,0.65); font-size: 11.5px; }

        @media (max-width: 720px) {
          .dk-search-fields { flex-direction: column; align-items: stretch; }
          .dk-advanced-link { margin-left: 0; }
        }

        /* ---------- main layout: listings + sidebar ---------- */

        .dk-main { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 28px; padding: 40px 0 56px; align-items: start; }
        @media (max-width: 980px) { .dk-main { grid-template-columns: 1fr; } }

        .dk-section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
        .dk-section-title { font-family: var(--font-display); font-weight: 700; color: var(--dk-dark); margin: 0; font-size: 21px; }
        .dk-view-all { display: inline-flex; align-items: center; gap: 5px; color: var(--dk-primary); font-weight: 600; font-size: 13.5px; text-decoration: none; }
        .dk-view-all:hover { color: var(--dk-primary-hover); }

        .dk-empty-state { color: var(--dk-muted); background: var(--dk-ivory); border: 1px dashed var(--dk-border); border-radius: var(--radius-md); padding: 28px; font-size: 14.5px; }

        .dk-grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 20px; }

        .dk-card {
          background-color: var(--dk-card);
          border: 1px solid var(--dk-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex; flex-direction: column; min-width: 0;
          animation: dkFadeInUp 0.45s ease both;
          box-shadow: 0 1px 2px var(--dk-shadow);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .dk-card:hover { transform: translateY(-5px); box-shadow: 0 18px 32px var(--dk-shadow-strong); border-color: #d8cfba; }

        .dk-card-media { position: relative; }
        .dk-card-img-wrap { display: block; background: var(--dk-ivory); }
        .dk-card-img { width: 100%; height: 158px; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .dk-card:hover .dk-card-img { transform: scale(1.06); }

        .dk-card-badges { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
        .dk-badge {
          font-size: 10.5px; font-weight: 700; padding: 4px 9px; border-radius: 5px;
          letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.4;
        }
        .dk-badge-listing { background-color: var(--dk-primary); color: #ffffff; }
        .dk-badge-featured { background-color: var(--dk-dark); color: #ffffff; }

        .dk-seal {
          display: inline-flex; align-items: center; gap: 4px;
          background-color: var(--dk-gold-bg); color: var(--dk-gold-deep);
          border: 1px dashed var(--dk-gold);
          font-size: 10px; font-weight: 700; padding: 3px 8px 3px 6px;
          border-radius: 999px; letter-spacing: 0.02em; text-transform: uppercase;
        }

        .dk-card-save { position: absolute; top: 8px; right: 8px; }

        .dk-card-body { padding: 14px; display: flex; flex-direction: column; flex: 1; }

        .dk-card-title {
          color: var(--dk-ink); font-size: 15.5px; font-weight: 700; line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
          transition: color 0.2s ease; margin-bottom: 6px;
        }
        .dk-card-title-link { text-decoration: none; }
        .dk-card:hover .dk-card-title { color: var(--dk-primary); }

        .dk-price { color: var(--dk-primary); font-weight: 700; font-size: 16.5px; margin-bottom: 8px; }
        .dk-price-unit { color: var(--dk-muted); font-weight: 500; font-size: 12.5px; }

        .dk-meta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; color: var(--dk-muted); font-size: 12px; margin-bottom: 8px; }
        .dk-meta-item { display: inline-flex; align-items: center; gap: 4px; }

        .dk-loc-row { display: inline-flex; align-items: center; gap: 4px; color: var(--dk-muted); font-size: 12px; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .dk-card-footer { margin-top: auto; border-top: 1px solid var(--dk-border); padding-top: 9px; }
        .dk-seller-info { color: var(--dk-muted); display: block; font-size: 11.5px; line-height: 1.5; overflow-wrap: break-word; }
        .dk-seller-verified { color: var(--dk-primary); }
        .dk-contact-info { color: var(--dk-ink); display: block; font-size: 11.5px; margin-top: 3px; font-weight: 600; }

        /* ---------- sidebar widgets ---------- */

        .dk-sidebar { display: flex; flex-direction: column; gap: 18px; }

        .dk-widget { background: var(--dk-card); border: 1px solid var(--dk-border); border-radius: var(--radius-md); padding: 20px; }
        .dk-widget-title { font-family: var(--font-display); font-weight: 700; color: var(--dk-dark); font-size: 16px; margin: 0 0 8px; }
        .dk-widget-text { color: var(--dk-muted); font-size: 13px; line-height: 1.55; margin: 0 0 16px; }

        .dk-widget-input {
          width: 100%; padding: 11px 13px; border-radius: var(--radius-sm);
          border: 1px solid var(--dk-border); font-size: 13.5px; color: var(--dk-ink);
          margin-bottom: 10px; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dk-widget-input::placeholder { color: #a39a89; }
        .dk-widget-input:focus { border-color: var(--dk-primary); box-shadow: 0 0 0 3px var(--dk-primary-ring); }

        .dk-widget-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px; width: 100%;
          background: var(--dk-primary); color: #ffffff; border: none; border-radius: var(--radius-sm);
          padding: 11px 16px; font-weight: 600; font-size: 13.5px; cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .dk-widget-btn:hover { background: var(--dk-primary-hover); }

        .dk-widget-note { display: flex; align-items: center; gap: 6px; color: var(--dk-muted); font-size: 11px; margin-top: 10px; }

        .dk-widget-alt { background: var(--dk-ivory); border-color: var(--dk-border); }
        .dk-widget-icon-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
        .dk-widget-icon {
          width: 38px; height: 38px; border-radius: 50%; background: var(--dk-gold-bg); color: var(--dk-gold-deep);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dk-widget-link { display: inline-flex; align-items: center; gap: 6px; color: var(--dk-primary); font-weight: 600; font-size: 13.5px; text-decoration: none; }
        .dk-widget-link:hover { color: var(--dk-primary-hover); }
      `}</style>

      {/* ---------- Hero ---------- */}
      <div className="dk-hero">
        <div className="dk-container">
          <div className="dk-hero-inner">
            <p className="dk-eyebrow">Your Trusted Partner in</p>
            <h1 className="dk-heading">Real Estate &amp; Land Investments</h1>
            <p className="dk-lede">
              Buy, sell, invest and verify land with confidence on Kenya&apos;s most trusted digital real estate
              platform.
            </p>

            <div className="dk-stats">
              {STATS.map((s) => (
                <div className="dk-stat" key={s.label}>
                  <span className="dk-stat-icon">
                    <s.icon size={16} strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="dk-stat-value">{s.value}</span>
                    <span className="dk-stat-label">{s.label}</span>
                  </span>
                </div>
              ))}
            </div>

            {!session?.user && (
              <p style={{ marginTop: 24 }}>
                <Link href="/login" style={{ color: "#fff", fontWeight: 600, marginRight: 16 }}>
                  Log in
                </Link>
                <Link href="/register" style={{ color: "var(--dk-gold)", fontWeight: 600 }}>
                  Create an account
                </Link>
              </p>
            )}
            {session?.user && (
              <p style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <NotificationBell />
                <Link href="/dashboard" style={{ color: "var(--dk-gold)", fontWeight: 600 }}>
                  Go to your dashboard
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="dk-container">
        {/* ---------- Search + feature strip, overlapping the hero ---------- */}
        <div className="dk-search-wrap">
          <div className="dk-search-panel">
            <nav className="dk-tabs">
              {SEARCH_TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={buildTabHref(tab, searchParams)}
                  className={`dk-tab${isTabActive(tab, searchParams) ? " dk-tab-active" : ""}`}
                >
                  <tab.icon size={14} strokeWidth={2.2} />
                  {tab.label}
                </Link>
              ))}
            </nav>

            <form method="get" className="dk-search-fields">
              <div className="dk-search-text">
                <Search size={16} strokeWidth={2.2} />
                <input type="text" name="location" defaultValue={searchParams.location} placeholder="Search location, property or keyword..." />
              </div>

              <PremiumSelect
                name="propertyType"
                options={PROPERTY_TYPE_OPTIONS}
                defaultValue={searchParams.propertyType}
                placeholder="Property Type"
                icon={<Building2 size={15} strokeWidth={2.2} />}
              />

              <PremiumSelect
                name="maxPrice"
                options={MAX_PRICE_OPTIONS}
                defaultValue={searchParams.maxPrice}
                placeholder="Max Price"
                icon={<Wallet size={15} strokeWidth={2.2} />}
              />

              <button type="submit" className="dk-search-submit">
                <Search size={15} strokeWidth={2.4} />
                Search
              </button>

              <Link href="/properties/advanced" className="dk-advanced-link">
                Advanced Search
                <SlidersHorizontal size={14} strokeWidth={2.2} />
              </Link>
            </form>

            <div className="dk-feature-strip">
              {FEATURE_STRIP.map((f) => (
                <div className="dk-feature" key={f.title}>
                  <span className="dk-feature-icon">
                    <f.icon size={16} strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="dk-feature-title" style={{ display: "block" }}>
                      {f.title}
                    </span>
                    <span className="dk-feature-subtitle">{f.subtitle}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- Listings + sidebar ---------- */}
        <div className="dk-main">
          <section>
            <div className="dk-section-head">
              <h2 className="dk-section-title">Featured Properties</h2>
              <Link href="/properties" className="dk-view-all">
                View All Properties
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            </div>

            {properties.length === 0 ? (
              <p className="dk-empty-state">No properties match your search. Try adjusting your filters.</p>
            ) : (
              <ul className="dk-grid">
                {properties.map((p: PropertyWithSeller, index: number) => (
                  <li key={p.id} className="dk-card" style={{ animationDelay: `${Math.min(index, 10) * 0.06}s` }}>
                    <div className="dk-card-media">
                      {p.imageUrl && (
                        <Link href={`/properties/${p.id}`} className="dk-card-img-wrap">
                          <img src={p.imageUrl} alt={p.title} className="dk-card-img" />
                        </Link>
                      )}

                      <div className="dk-card-badges">
                        <span className="dk-badge dk-badge-listing">
                          {p.listingType === "SALE" ? "For Sale" : "For Rent"}
                        </span>
                        {p.featured && <span className="dk-badge dk-badge-featured">Featured</span>}
                        {p.daktopVerified && <VerifiedSeal />}
                      </div>

                      {session?.user?.role === "BUYER" && (
                        <div className="dk-card-save">
                          <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                        </div>
                      )}
                    </div>

                    <div className="dk-card-body">
                      <Link href={`/properties/${p.id}`} className="dk-card-title-link">
                        <strong className="dk-card-title">{p.title}</strong>
                      </Link>

                      <div className="dk-price">
                        KSh {p.price.toLocaleString()}
                        {p.listingType === "RENT" && <span className="dk-price-unit"> /mo</span>}
                      </div>

                      <div className="dk-meta-row">
                        {p.bedrooms !== null && (
                          <span className="dk-meta-item">
                            <BedDouble size={13} /> {p.bedrooms}
                          </span>
                        )}
                        {p.bathrooms !== null && (
                          <span className="dk-meta-item">
                            <Bath size={13} /> {p.bathrooms}
                          </span>
                        )}
                        {p.acreage !== null && (
                          <span className="dk-meta-item">
                            <Maximize size={13} /> {p.acreage} acres
                          </span>
                        )}
                        {p.bedrooms === null && p.bathrooms === null && p.acreage === null && (
                          <span className="dk-meta-item">{getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)}</span>
                        )}
                      </div>

                      <div className="dk-loc-row">
                        <MapPin size={12} /> {p.location}
                      </div>

                      <div className="dk-card-footer">
                        <small className="dk-seller-info">
                          Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
                          {p.seller.verified && (
                            <span className="dk-seller-verified"> — Verified {getRoleLabel(p.seller.role)}</span>
                          )}
                          {p.representingName && <> — representing {p.representingName}</>}
                        </small>
                        {p.showContact && p.seller.phone && (
                          <small className="dk-contact-info">Contact: {p.seller.phone}</small>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="dk-sidebar">
            <div className="dk-widget">
              <h3 className="dk-widget-title">Verify Title Deed Online</h3>
              <p className="dk-widget-text">Verify the authenticity of any title deed in Kenya online.</p>
              {/* Static UI only — wire this up to your title-verification endpoint. */}
              <input className="dk-widget-input" type="text" placeholder="Enter Title Number e.g. KAJADO/12345" />
              <button type="button" className="dk-widget-btn">
                <ShieldCheck size={15} />
                Verify Now
              </button>
              <div className="dk-widget-note">
                <Lock size={12} />
                Powered by Official Records &amp; Licensed Partners
              </div>
            </div>

            <div className="dk-widget dk-widget-alt">
              <div className="dk-widget-icon-row">
                <span className="dk-widget-icon">
                  <Users size={17} />
                </span>
                <div>
                  <h3 className="dk-widget-title" style={{ fontSize: 15 }}>
                    Need Professional Services?
                  </h3>
                </div>
              </div>
              <p className="dk-widget-text">
                Connect with our trusted lawyers, surveyors, valuers and property experts.
              </p>
              <Link href="/services" className="dk-widget-link">
                Get Expert Help
                <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>

        <BuySellCard session={session} />
      </div>
    </div>
  );
}
