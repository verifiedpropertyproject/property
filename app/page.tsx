import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import NotificationBell from "@/components/NotificationBell";
import PropertyCard, { type PropertyWithSeller } from "@/components/PropertyCard";

import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/lib/propertyConstants";
import {
  AVAILABILITY_LABELS,
} from "@/lib/availabilityStatus";
import BuySellCard from "@/components/BuySellCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
// import ThemeToggle from "@/components/ThemeToggle";
import PremiumSelect from "./PremiumSelect";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import HomepageGallery from "@/components/HomepageGallery";
import PropertyBackground from "@/components/PropertyBackground";


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

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);

  const where: Prisma.PropertyWhereInput = {
    status: "APPROVED",
    paused: false,
    seller: { suspended: false },
    // Resale properties (Auction / Standard Resale / Distressed Sale / Foreclosure) have their
    // own dedicated page — see app/resale/page.tsx — and are kept out of the normal listings so
    // the two don't mix.
    resaleCategory: null,
  };

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

  // Only auto-expand the detailed search section when the visitor actually
  // came in with one of those filters set — a plain keyword search (or no
  // search at all) should land with it collapsed.
  const hasAdvancedFilters = Boolean(
    searchParams.location ||
      searchParams.propertyType ||
      searchParams.listingType ||
      searchParams.availabilityStatus ||
      searchParams.minPrice ||
      searchParams.maxPrice ||
      (searchParams.sort && searchParams.sort !== "newest")
  );

  // Homepage carousel: which listings appear here is entirely up to a super
  // admin, via the same `featured` flag they already toggle from the admin
  // property list (POST /api/properties/[id]/feature, isAdminRole-gated).
  // We simply take up to the three most recently created listings among
  // those an admin has featured (that are also approved and not paused) —
  // no separate admin UI needed.
  //
  // `resaleCategory: null` mirrors the `where` filter above: a resale listing
  // can be featured too, but that only feeds the resale page's own featured
  // carousel (see app/resale/page.tsx). Without this filter here, an admin
  // featuring a resale listing would make it leak into this normal-listings
  // slider as well.
  const featuredProperties = await prisma.property.findMany({
    where: {
      featured: true,
      status: "APPROVED",
      paused: false,
      seller: { suspended: false },
      resaleCategory: null,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      imageUrl: true,
      location: true,
      propertyType: true,
      propertyTypeOther: true,
      price: true,
    },
  });

  // Admin-managed homepage gallery (see components/GalleryManager.tsx in the dashboard and
  // app/api/gallery) — a simple slow-scrolling strip of infographics/promo images, entirely
  // independent of any property listing.
  const galleryImages = await prisma.galleryImage.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, imageUrl: true, caption: true },
  });

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
    where: { status: "APPROVED", paused: false, seller: { suspended: false } },
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
      

       <Nav session={session} />

      <div className="dk-container">
        {/* ---------- Hero: intro + search panel ---------- */}
        <div className="dk-hero-section">
          <PropertyBackground />

          <div className="dk-hero">
          <header className="dk-hero-intro">
            <div className="flex items-center justify-between gap-3">
              <span className="dk-kicker">Premium property, Nairobi &amp; Kiambu</span>
              
            </div>
            <h1 className="dk-heading">Nairobi and Kiambu's trusted marketplace for high-end properties</h1>
            <p className="dk-lede">
              Buy and sell premium homes, land and commercial property across Nairobi and Kiambu, with verified
              ownership and professional due diligence on every listing.
            </p>

            {session?.user ? (
              <div className="dk-hero-auth-row">
                <NotificationBell />
                <Link href="/dashboard" className="dk-hero-cta">
                  Go to your dashboard
                </Link>
              </div>
            ) : (
              <div className="dk-hero-auth-row">
                <Link href="/login" className="dk-hero-cta-outline">
                  Log in
                </Link>
                <Link href="/register" className="dk-hero-cta">
                  Create an account
                </Link>
              </div>
            )}
          </header>

          <FeaturedCarousel properties={featuredProperties} />

          <section id="find-a-property" className="dk-search-panel">
            <h2 className="dk-search-title">Find a property</h2>
            <hr className="dk-search-rule" />

            <form method="get">
              <div className="dk-quick-search-row">
                <div className="dk-field dk-field--grow">
                  <label className="dk-field-label">Keyword search</label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchParams.q}
                    placeholder="Search titles, descriptions, location, seller and more"
                    className="dk-input"
                  />
                </div>
                <button type="submit" className="dk-submit-btn dk-submit-btn--quick">
                  Search properties
                </button>
              </div>

              <details className="dk-adv-search" open={hasAdvancedFilters}>
                <summary className="dk-adv-summary">
                  <span className="dk-adv-summary-title">Detailed search</span>
                  <span className="dk-adv-summary-hint">Location, price, type &amp; more</span>
                </summary>

                <div className="dk-field-grid">
                  <div className="dk-field">
                    <label className="dk-field-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      defaultValue={searchParams.location}
                      placeholder="e.g. Karen, Runda, Kiambu Road"
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
              </details>

              <div className="dk-search-actions">
                <a href="/" className="dk-clear-link">
                  Clear filters
                </a>
              </div>
            </form>
          </section>
          </div>
        </div>

        <hr className="dk-divider" />

        {/* ---------- Listings ---------- */}
        <section>
          <h2 className="dk-listings-heading">Premium listings in Nairobi &amp; Kiambu ({properties.length})</h2>

          {properties.length === 0 ? (
            <p className="dk-empty-state">No premium properties match your search. Try adjusting your filters.</p>
          ) : (
            <ul className="dk-grid">
              {properties.map((p: PropertyWithSeller, index: number) => (
                <PropertyCard
                  key={p.id}
                  p={p}
                  index={index}
                  showSaveButton={session?.user?.role === "BUYER"}
                  isSaved={savedPropertyIds.has(p.id)}
                  listingCount={listingCountBySellerId.get(p.sellerId) ?? 0}
                />
              ))}
            </ul>
          )}
        </section>

        <BuySellCard session={session} />
      </div>
      <Marquee />
      <HomepageGallery images={galleryImages} />
      <Footer/>

    </div>
  );
}
