import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import NotificationBell from "@/components/NotificationBell";

import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
import BuySellCard from "@/components/BuySellCard";

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

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);

  const where: Prisma.PropertyWhereInput = { status: "APPROVED", seller: { suspended: false } };

  if (searchParams.location) {
    where.location = { contains: searchParams.location };
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
    where.price = {};
    if (searchParams.minPrice) where.price.gte = Number(searchParams.minPrice);
    if (searchParams.maxPrice) where.price.lte = Number(searchParams.maxPrice);
  }

  const properties = await prisma.property.findMany({
    where,
    include: { seller: { select: { name: true, email: true, role: true, phone: true, verified: true } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  let savedPropertyIds = new Set<string>();
  if (session?.user?.role === "BUYER") {
    const saved = await prisma.savedProperty.findMany({
      where: { buyerId: session.user.id },
      select: { propertyId: true },
    });
    savedPropertyIds = new Set(saved.map((s: { propertyId: string }) => s.propertyId));
  }

  return (
    <div className="page">
      <div className="hero">
        <div className="utilityBar">
          {session?.user ? (
            <>
              <NotificationBell />
              <Link href="/dashboard">Go to your dashboard</Link>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <span className="heroDivider">|</span>
              <Link href="/register">Create an account</Link>
            </>
          )}
        </div>

        <div className="heroInner">
          <header>
            <span className="heroEyebrow">Verified Listings, Trusted Partners</span>
            <h1 className="heroTitle">
              East Africa&apos;s Trusted Marketplace for Verified Properties
            </h1>
            <p className="heroSubtitle">
              Buy and sell land, homes and commercial property with verified ownership and professional due
              diligence.
            </p>
          </header>
        </div>

        <div className="searchWrap">
          <div className="searchCard">
            <p className="searchTitle">Find a Property</p>

            <form method="get">
              <div className="searchGrid">
                <div className="field">
                  <label>Location / County</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={searchParams.location}
                    placeholder="e.g. Kitengela"
                  />
                </div>

                <div className="field">
                  <label>Property Type</label>
                  <select name="propertyType" defaultValue={searchParams.propertyType || ""}>
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PROPERTY_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Buy or Rent</label>
                  <select name="listingType" defaultValue={searchParams.listingType || ""}>
                    <option value="">Any</option>
                    <option value="SALE">For sale</option>
                    <option value="RENT">For rent</option>
                  </select>
                </div>

                <div className="field">
                  <label>Availability</label>
                  <select name="availabilityStatus" defaultValue={searchParams.availabilityStatus || ""}>
                    <option value="">Any</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>

                <div className="field">
                  <label>Min Price (KSh)</label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={searchParams.minPrice}
                    min="0"
                    placeholder="Any"
                  />
                </div>

                <div className="field">
                  <label>Max Price (KSh)</label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={searchParams.maxPrice}
                    min="0"
                    placeholder="Any"
                  />
                </div>
              </div>

              <div className="searchActions">
                <button type="submit" className="searchSubmit">
                  Search Properties
                </button>
                <a href="/" className="clearLink">
                  Clear filters
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      <section className="listingsSection">
        <div className="listingsHeader">
          <h2 className="listingsTitle">Verified Listings ({properties.length})</h2>
        </div>

        {properties.length === 0 ? (
          <p className="emptyState">No properties match your search. Try adjusting your filters.</p>
        ) : (
          <ul className="listingsGrid">
            {properties.map((p: PropertyWithSeller) => (
              <li key={p.id} className="card">
                {p.imageUrl && (
                  <Link href={`/properties/${p.id}`} className="cardImageWrap">
                    <img src={p.imageUrl} alt={p.title} />
                    <div className="cardBadges">
                      <div className="badgeGroup">
                        {p.featured && <span className="badgeFeatured">Featured</span>}
                        {p.daktopVerified && <span className="badgeVerified">Daktop Verified</span>}
                      </div>
                      <span className="badgeStatus">
                        {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                      </span>
                    </div>
                  </Link>
                )}

                <div className="cardBody">
                  <Link href={`/properties/${p.id}`} className="cardTitleRow">
                    <strong className="cardTitle">{p.title}</strong>
                  </Link>

                  <div className="cardMetaLine">
                    <span className={p.verified ? "verifiedTag" : "notVerifiedTag"}>
                      {p.verified ? "Verified" : "Not Verified"}
                    </span>
                    — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} —{" "}
                    {p.listingType === "SALE" ? "For sale" : "For rent"}
                  </div>

                  <div className="cardPrice">KSh {p.price.toLocaleString()}</div>

                  <div className="cardLocation">
                    <span>{p.location}</span>
                    {p.bedrooms !== null && <span>— {p.bedrooms} bed</span>}
                    {p.bathrooms !== null && <span>— {p.bathrooms} bath</span>}
                    {p.acreage !== null && <span>— {p.acreage} acres</span>}
                  </div>

                  <div className="cardFooter">
                    <span className="sellerLine">
                      Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
                      {p.seller.verified && (
                        <span className="verifiedSeller"> — Verified {getRoleLabel(p.seller.role)}</span>
                      )}
                      {p.representingName && <> — representing {p.representingName}</>}
                    </span>

                    {p.showContact && p.seller.phone && (
                      <span className="contactLine">Contact: {p.seller.phone}</span>
                    )}
                  </div>

                  {session?.user?.role === "BUYER" && (
                    <div className="saveButtonWrap">
                      <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BuySellCard session={session} />

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap");

        .page {
          --forest-900: #0a2f23;
          --forest-800: #0b3d2e;
          --forest-700: #0f4c38;
          --gold-500: #c9992e;
          --gold-600: #b3841f;
          --cream-50: #fbfaf7;
          --ink-900: #17211d;
          --ink-600: #55625b;
          --ink-400: #8a958f;
          --line: #e6e8e3;
          --card-shadow: 0 1px 2px rgba(10, 47, 35, 0.06), 0 8px 24px rgba(10, 47, 35, 0.06);
          font-family: "Inter", system-ui, sans-serif;
          color: var(--ink-900);
          background: var(--cream-50);
        }

        .page h1, .page h2, .page strong { font-family: "Poppins", "Inter", system-ui, sans-serif; }

        /* Hero */
        .hero {
          position: relative;
          padding: 64px 6vw 140px;
          background:
            linear-gradient(100deg, rgba(6, 26, 20, 0.92) 0%, rgba(6, 26, 20, 0.55) 45%, rgba(6, 26, 20, 0.15) 75%),
            url("https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1600&auto=format&fit=crop") center/cover no-repeat;
          color: #fff;
          overflow: visible;
        }
        .heroInner { max-width: 640px; }
        .heroEyebrow {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--gold-500);
          margin: 0 0 14px;
        }
        .heroTitle {
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.15;
          font-weight: 700;
          margin: 0 0 18px;
          color: #fff;
        }
        .heroSubtitle {
          font-size: 17px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.82);
          max-width: 480px;
          margin: 0 0 28px;
        }
        .utilityBar {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          margin-bottom: 36px;
        }
        .utilityBar a {
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .utilityBar a:hover { color: #fff; text-decoration: underline; }
        .heroDivider { color: rgba(255, 255, 255, 0.5); font-size: 13px; }

        /* Search card */
        .searchWrap {
          max-width: 1180px;
          margin: -96px auto 0;
          padding: 0 6vw;
          position: relative;
          z-index: 2;
        }
        .searchCard {
          background: var(--forest-800);
          border-radius: 18px;
          padding: 28px 28px 22px;
          box-shadow: 0 20px 45px rgba(6, 26, 20, 0.35);
        }
        .searchTitle {
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin: 0 0 18px;
          text-transform: uppercase;
          opacity: 0.85;
        }
        .searchGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px 16px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .field input, .field select {
          height: 44px;
          border-radius: 10px;
          border: none;
          padding: 0 14px;
          font-size: 14px;
          font-family: "Inter", sans-serif;
          color: var(--ink-900);
          background: #fff;
          outline: none;
        }
        .field input::placeholder { color: var(--ink-400); }
        .field input:focus, .field select:focus { box-shadow: 0 0 0 2px var(--gold-500); }
        .searchActions {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        .searchSubmit {
          background: var(--gold-500);
          color: var(--forest-900);
          border: none;
          height: 46px;
          padding: 0 30px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .searchSubmit:hover { background: var(--gold-600); }
        .clearLink {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .clearLink:hover { color: #fff; }

        /* Listings */
        .listingsSection { max-width: 1180px; margin: 0 auto; padding: 72px 6vw 96px; }
        .listingsHeader {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .listingsTitle { font-size: 24px; font-weight: 700; color: var(--forest-900); margin: 0; }
        .listingsGrid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }
        .emptyState {
          padding: 48px 24px;
          text-align: center;
          color: var(--ink-600);
          background: #fff;
          border: 1px dashed var(--line);
          border-radius: 14px;
        }

        /* Property card */
        .card {
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--line);
          box-shadow: var(--card-shadow);
          display: flex;
          flex-direction: column;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(10, 47, 35, 0.08), 0 16px 32px rgba(10, 47, 35, 0.1);
        }
        .cardImageWrap { position: relative; aspect-ratio: 4 / 3; background: #eef1ee; display: block; }
        .cardImageWrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cardBadges {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .badgeGroup { display: flex; gap: 6px; flex-wrap: wrap; }
        .badgeFeatured, .badgeVerified, .badgeStatus {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          padding: 4px 9px;
          border-radius: 6px;
          text-transform: uppercase;
          color: #fff;
          white-space: nowrap;
        }
        .badgeFeatured { background: var(--gold-500); color: var(--forest-900); }
        .badgeVerified { background: var(--forest-800); }
        .badgeStatus { background: rgba(23, 33, 29, 0.75); backdrop-filter: blur(2px); }
        .cardBody { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .cardTitleRow { text-decoration: none; color: inherit; }
        .cardTitle { font-size: 16px; font-weight: 700; color: var(--ink-900); line-height: 1.35; }
        .cardMetaLine {
          font-size: 13px;
          color: var(--ink-600);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .verifiedTag { font-weight: 600; color: var(--forest-700); }
        .notVerifiedTag { font-weight: 600; color: var(--ink-400); }
        .cardPrice { font-size: 19px; font-weight: 700; color: var(--forest-800); margin: 2px 0; }
        .cardLocation { font-size: 13px; color: var(--ink-600); display: flex; flex-wrap: wrap; gap: 4px; }
        .cardFooter {
          margin-top: 6px;
          padding-top: 10px;
          border-top: 1px solid var(--line);
          font-size: 12.5px;
          color: var(--ink-600);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sellerLine { color: var(--ink-600); }
        .verifiedSeller { color: var(--forest-700); font-weight: 600; }
        .contactLine { color: var(--forest-800); font-weight: 600; }
        .saveButtonWrap { margin-top: 10px; }

        /* Responsive */
        @media (max-width: 860px) {
          .searchGrid { grid-template-columns: repeat(2, 1fr); }
          .searchWrap { margin-top: -70px; }
          .hero { padding: 40px 6vw 120px; }
        }
        @media (max-width: 560px) {
          .searchGrid { grid-template-columns: 1fr; }
          .searchActions { flex-direction: column; align-items: stretch; }
          .searchSubmit { width: 100%; }
          .listingsHeader { flex-direction: column; align-items: flex-start; gap: 8px; }
        }
      `}</style>
    </div>
  );
}
