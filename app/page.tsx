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
// import ThemeToggle from "@/components/ThemeToggle";
import PremiumSelect from "./PremiumSelect";
import Nav from "@/components/Nav";


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
      

<Nav></Nav>
      <div className="dk-container">
        {/* ---------- Hero: intro + search panel ---------- */}
        <div className="dk-hero">
          <header className="dk-hero-intro">
            <div className="flex items-center justify-between gap-3">
              <span className="dk-kicker">Verified property, East Africa</span>
              
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
