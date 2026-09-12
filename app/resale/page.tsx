import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import PropertyCard, { type PropertyWithSeller } from "@/components/PropertyCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import PremiumSelect from "../PremiumSelect";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/lib/propertyConstants";
import { AVAILABILITY_LABELS } from "@/lib/availabilityStatus";
import { RESALE_CATEGORIES, getResaleCategoryLabel } from "@/lib/resaleCategory";

type SearchParams = {
  q?: string;
  location?: string;
  propertyType?: string;
  resaleCategory?: string;
  availabilityStatus?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

const RESALE_CATEGORY_OPTIONS = RESALE_CATEGORIES.map((value) => ({ value, label: getResaleCategoryLabel(value) }));

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

export default async function ResalePage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);

  // Only ever admin-listed resale properties — kept entirely separate from the normal
  // marketplace listings on the homepage. See app/page.tsx, which excludes these with
  // `resaleCategory: null`.
  const where: Prisma.PropertyWhereInput = {
    status: "APPROVED",
    paused: false,
    seller: { suspended: false },
    resaleCategory: { not: null },
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
        { availabilityStatus: { contains: q, mode: "insensitive" } },
      ];
    }
  }

  if (searchParams.location) {
    where.location = { contains: searchParams.location, mode: "insensitive" };
  }
  if (searchParams.propertyType) {
    where.propertyType = searchParams.propertyType;
  }
  if (searchParams.resaleCategory && (RESALE_CATEGORIES as readonly string[]).includes(searchParams.resaleCategory)) {
    where.resaleCategory = searchParams.resaleCategory;
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

  // Same rotating "featured" carousel as the homepage (see FeaturedCarousel /
  // app/page.tsx), but scoped to resale-only listings so a property featured
  // here never shows up mixed in with the regular marketplace carousel.
  const featuredResaleProperties = await prisma.property.findMany({
    where: {
      featured: true,
      status: "APPROVED",
      paused: false,
      seller: { suspended: false },
      resaleCategory: { not: null },
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

  const sellerListingCounts = await prisma.property.groupBy({
    by: ["sellerId"],
    where: { status: "APPROVED", paused: false, seller: { suspended: false } },
    _count: { _all: true },
  });
  const listingCountBySellerId = new Map(sellerListingCounts.map((row) => [row.sellerId, row._count._all]));

  let savedPropertyIds = new Set<string>();
  if (session?.user?.role === "BUYER") {
    const saved = await prisma.savedProperty.findMany({
      where: { buyerId: session.user.id },
      select: { propertyId: true },
    });
    savedPropertyIds = new Set(saved.map((s: { propertyId: string }) => s.propertyId));
  }

  return (
    <div className="dk-page dk-page--resale">
      <Nav session={session} />

      <div className="dk-container">
        <div className="dk-hero-section">
          <div className="dk-hero">
            <header className="dk-hero-intro">
              <span className="dk-kicker">Auction, distressed &amp; foreclosure sales</span>
              <h1 className="dk-heading">Resale properties in Nairobi &amp; Kiambu</h1>
              <p className="dk-lede">
                Properties the Daktop team is listing directly on the market&apos;s behalf — auctions, standard
                resales, distressed sales and foreclosures — kept separate from our regular owner and agent
                listings.
              </p>
            </header>

            <FeaturedCarousel
              properties={featuredResaleProperties}
              kicker="Handpicked resale opportunities"
              title="Featured resale properties"
            />

            <section className="dk-search-panel">
              <h2 className="dk-search-title">Find a resale property</h2>
              <hr className="dk-search-rule" />

              <form method="get">
                <div className="dk-field-grid">
                  <div className="dk-field" style={{ flexBasis: "100%" }}>
                    <label className="dk-field-label">Keyword search</label>
                    <input
                      type="text"
                      name="q"
                      defaultValue={searchParams.q}
                      placeholder="Search titles, descriptions, location and more"
                      className="dk-input"
                    />
                  </div>

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
                    name="resaleCategory"
                    label="Resale category"
                    options={RESALE_CATEGORY_OPTIONS}
                    defaultValue={searchParams.resaleCategory}
                    placeholder="Any category"
                  />

                  <PremiumSelect
                    name="propertyType"
                    label="Property type"
                    options={PROPERTY_TYPE_OPTIONS}
                    defaultValue={searchParams.propertyType}
                    placeholder="Any type"
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
                    Search resale properties
                  </button>
                  <a href="/resale" className="dk-clear-link">
                    Clear filters
                  </a>
                </div>
              </form>
            </section>
          </div>
        </div>

        <hr className="dk-divider" />

        <section>
          <h2 className="dk-listings-heading">Resale properties ({properties.length})</h2>

          {properties.length === 0 ? (
            <p className="dk-empty-state">No resale properties match your search. Try adjusting your filters.</p>
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
      </div>

      <Marquee />
      <Footer />
    </div>
  );
}
