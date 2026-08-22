import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel } from "@/lib/propertyConstants";
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
    <div className="dt-page">

      <div>
        <header className="dt-hero">
          <div className="dt-hero__inner">
            <h1 className="dt-hero__title">
              East Africa&apos;s Trusted Marketplace for Verified Properties
            </h1>
            <p className="dt-hero__subtitle">
              Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
            </p>

            {session?.user ? (
              <p className="dt-hero__actions">
                <Link href="/dashboard" className="dt-btn dt-btn--gold">
                  Go to your dashboard
                </Link>
              </p>
            ) : (
              <p className="dt-hero__actions">
                <Link href="/login" className="dt-btn dt-btn--outline">
                  Log in
                </Link>
                <Link href="/register" className="dt-btn dt-btn--gold">
                  Create an account
                </Link>
              </p>
            )}
          </div>
        </header>

        <section className="dt-search-wrap">
          <div className="dt-search">
            <h2 className="dt-search__title">
              Find a Property
            </h2>

            <form method="get" className="dt-search__form">
              <div className="dt-search__grid">
                <div className="dt-field">
                  <label>Location / County</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={searchParams.location}
                    placeholder="e.g. Kitengela"
                  />
                </div>

                <div className="dt-field">
                  <label>Property Type</label>
                  <select
                    name="propertyType"
                    defaultValue={searchParams.propertyType || ""}
                  >
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PROPERTY_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dt-field">
                  <label>Buy or Rent</label>
                  <select
                    name="listingType"
                    defaultValue={searchParams.listingType || ""}
                  >
                    <option value="">Any</option>
                    <option value="SALE">For sale</option>
                    <option value="RENT">For rent</option>
                  </select>
                </div>

                <div className="dt-field">
                  <label>Availability</label>
                  <select
                    name="availabilityStatus"
                    defaultValue={searchParams.availabilityStatus || ""}
                  >
                    <option value="">Any</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>

                <div className="dt-field">
                  <label>Min Price (KSh)</label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={searchParams.minPrice}
                    min="0"
                    placeholder="Any"
                  />
                </div>

                <div className="dt-field">
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

              <div className="dt-search__buttons">
                <button type="submit" className="dt-btn dt-btn--gold dt-btn--wide">
                  Search Properties
                </button>
                <a href="/" className="dt-link-muted">
                  Clear filters
                </a>
              </div>
            </form>
          </div>
        </section>
      </div>

      <section className="dt-listings">
        <div className="dt-listings__header">
          <h2>
            Verified Listings <span className="dt-listings__count">({properties.length})</span>
          </h2>
        </div>

        {properties.length === 0 ? (
          <p className="dt-empty">No properties match your search. Try adjusting your filters.</p>
        ) : (
          <ul className="dt-grid">
            {properties.map((p: PropertyWithSeller, i: number) => (
              <li key={p.id} className="dt-card" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                <div className="dt-card__media">
                  {p.imageUrl && (
                    <Link href={`/properties/${p.id}`} className="dt-card__imglink">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                      />
                    </Link>
                  )}

                  <div className="dt-card__badges">
                    {p.featured && (
                      <span className="dt-badge dt-badge--featured">
                        FEATURED
                      </span>
                    )}
                    <span className={`dt-badge dt-badge--status dt-badge--${(p.availabilityStatus || "").toLowerCase()}`}>
                      {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                    </span>
                  </div>

                  {session?.user?.role === "BUYER" && (
                    <div className="dt-card__save">
                      <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                    </div>
                  )}
                </div>

                <div className="dt-card__body">
                  <Link href={`/properties/${p.id}`} className="dt-card__title">
                    <strong>
                      {p.title}
                    </strong>
                  </Link>

                  <div className="dt-card__meta-row">
                    <span className={p.verified ? "dt-tag dt-tag--verified" : "dt-tag dt-tag--unverified"}>
                      {p.verified ? "Verified" : "Not Verified"}
                    </span>
                    <span className="dt-card__type">
                      {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} · {p.listingType === "SALE" ? "For sale" : "For rent"}
                    </span>
                  </div>

                  <div className="dt-card__price">
                    KSh {p.price.toLocaleString()}
                  </div>

                  <div className="dt-card__facts">
                    <span className="dt-card__location">{p.location}</span>
                    {p.bedrooms !== null && <span>{p.bedrooms} bed</span>}
                    {p.bathrooms !== null && <span>{p.bathrooms} bath</span>}
                    {p.acreage !== null && <span>{p.acreage} acres</span>}
                  </div>

                  <div className="dt-card__divider" />

                  <small className="dt-card__seller">
                    Listed by {p.seller.name || p.seller.email} ({p.seller.role === "AGENT" ? "Agent" : "Owner"})
                    {p.seller.verified && (
                      <span className="dt-card__seller-verified">
                        {" "}
                        — Verified {p.seller.role === "AGENT" ? "Agent" : "Owner"}
                      </span>
                    )}
                    {p.representingName && <> — representing {p.representingName}</>}
                  </small>

                  {p.showContact && p.seller.phone && (
                    <small className="dt-card__contact">
                      Contact: {p.seller.phone}
                    </small>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BuySellCard session={session} />

      <style>{`
        .dt-page {
          --forest: #0f3d2e;
          --forest-deep: #0a2b21;
          --forest-light: #1b5e42;
          --gold: #c9972f;
          --gold-light: #e7c065;
          --cream: #faf8f3;
          --ink: #16241c;
          --muted: #5b6b62;
          --border: #e6e2d6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
          background: var(--cream);
          color: var(--ink);
        }

        /* ---------- Hero ---------- */
        .dt-hero {
          position: relative;
          background:
            radial-gradient(1200px 500px at 15% 0%, rgba(201,151,47,0.18), transparent 60%),
            linear-gradient(120deg, var(--forest-deep) 0%, var(--forest) 55%, var(--forest-light) 100%);
          padding: 88px 24px 130px;
          overflow: hidden;
        }
        .dt-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 75%);
          pointer-events: none;
        }
        .dt-hero__inner {
          position: relative;
          max-width: 780px;
          margin: 0 auto;
          text-align: center;
          animation: dtFadeUp 700ms cubic-bezier(.22,1,.36,1) both;
        }
        .dt-hero__title {
          font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
          font-size: clamp(2rem, 4.2vw, 3.1rem);
          line-height: 1.15;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.01em;
          margin: 0 0 18px;
        }
        .dt-hero__subtitle {
          font-size: 1.05rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.82);
          max-width: 560px;
          margin: 0 auto 30px;
        }
        .dt-hero__actions {
          display: flex;
          gap: 14px;
          justify-content: center;
          margin: 0;
        }

        /* ---------- Buttons ---------- */
        .dt-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 26px;
          border-radius: 999px;
          font-size: 0.95rem;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 220ms cubic-bezier(.22,1,.36,1), box-shadow 220ms ease, background 220ms ease, border-color 220ms ease;
          white-space: nowrap;
        }
        .dt-btn:hover { transform: translateY(-2px); }
        .dt-btn:active { transform: translateY(0); }
        .dt-btn--gold {
          background: linear-gradient(135deg, var(--gold-light), var(--gold));
          color: #241a06;
          box-shadow: 0 8px 20px -8px rgba(201,151,47,0.65);
        }
        .dt-btn--gold:hover { box-shadow: 0 12px 28px -8px rgba(201,151,47,0.8); }
        .dt-btn--outline {
          background: rgba(255,255,255,0.06);
          color: #fff;
          border-color: rgba(255,255,255,0.35);
        }
        .dt-btn--outline:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.55); }
        .dt-btn--wide { padding: 13px 36px; }

        .dt-link-muted {
          color: var(--muted);
          font-size: 0.9rem;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: color 180ms ease, border-color 180ms ease;
        }
        .dt-link-muted:hover { color: var(--forest); border-color: var(--forest); }

        /* ---------- Floating search card ---------- */
        .dt-search-wrap {
          position: relative;
          max-width: 1100px;
          margin: -80px auto 0;
          padding: 0 20px;
          z-index: 5;
        }
        .dt-search {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 24px 60px -20px rgba(15,61,46,0.35), 0 2px 8px rgba(0,0,0,0.04);
          padding: 32px 34px 26px;
          animation: dtFadeUp 700ms 120ms cubic-bezier(.22,1,.36,1) both;
          border: 1px solid var(--border);
        }
        .dt-search__title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--forest);
          margin: 0 0 20px;
        }
        .dt-search__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .dt-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .dt-field label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--muted);
        }
        .dt-field input,
        .dt-field select {
          border: 1px solid var(--border);
          background: #fbfaf7;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.92rem;
          color: var(--ink);
          outline: none;
          transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }
        .dt-field input:hover,
        .dt-field select:hover { border-color: #cfcabb; }
        .dt-field input:focus,
        .dt-field select:focus {
          border-color: var(--gold);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(201,151,47,0.18);
        }
        .dt-search__buttons {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* ---------- Listings ---------- */
        .dt-listings {
          max-width: 1180px;
          margin: 66px auto 90px;
          padding: 0 20px;
        }
        .dt-listings__header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 26px;
        }
        .dt-listings__header h2 {
          font-family: Georgia, "Iowan Old Style", serif;
          font-size: 1.6rem;
          color: var(--forest);
          margin: 0;
        }
        .dt-listings__count {
          color: var(--muted);
          font-weight: 400;
          font-size: 1.1rem;
        }
        .dt-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--muted);
          background: #fff;
          border: 1px dashed var(--border);
          border-radius: 16px;
        }

        .dt-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 26px;
        }

        .dt-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: 0 1px 3px rgba(15,61,46,0.06);
          transition: transform 260ms cubic-bezier(.22,1,.36,1), box-shadow 260ms cubic-bezier(.22,1,.36,1), border-color 260ms ease;
          animation: dtFadeUp 620ms cubic-bezier(.22,1,.36,1) both;
        }
        .dt-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 26px 40px -18px rgba(15,61,46,0.28);
          border-color: rgba(201,151,47,0.4);
        }

        .dt-card__media {
          position: relative;
          aspect-ratio: 4 / 3;
          background: linear-gradient(135deg, #eef0ea, #dfe3d9);
          overflow: hidden;
        }
        .dt-card__imglink { display: block; width: 100%; height: 100%; }
        .dt-card__media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 500ms cubic-bezier(.22,1,.36,1);
        }
        .dt-card:hover .dt-card__media img { transform: scale(1.08); }

        .dt-card__badges {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 8px;
        }
        .dt-badge {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 5px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
        }
        .dt-badge--featured {
          background: rgba(15,61,46,0.9);
          color: #fff;
        }
        .dt-badge--status { background: rgba(255,255,255,0.92); color: var(--ink); }
        .dt-badge--available { color: #1a7a44; }
        .dt-badge--reserved { color: #a56a00; }
        .dt-badge--sold, .dt-badge--rented { color: #a13232; }

        .dt-card__save {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255,255,255,0.92);
          border-radius: 999px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.12);
          transition: transform 200ms ease;
        }
        .dt-card__save:hover { transform: scale(1.08); }

        .dt-card__body {
          padding: 18px 18px 16px;
        }
        .dt-card__title {
          display: block;
          color: var(--ink);
          text-decoration: none;
          font-size: 1.05rem;
          margin-bottom: 8px;
          transition: color 180ms ease;
        }
        .dt-card__title:hover { color: var(--forest); }

        .dt-card__meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .dt-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .dt-tag--verified { background: rgba(27,94,66,0.12); color: var(--forest-light); }
        .dt-tag--unverified { background: rgba(91,107,98,0.12); color: var(--muted); }
        .dt-card__type { font-size: 0.82rem; color: var(--muted); }

        .dt-card__price {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--forest);
          margin-bottom: 8px;
        }

        .dt-card__facts {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          font-size: 0.85rem;
          color: var(--muted);
          margin-bottom: 12px;
        }
        .dt-card__facts span:not(:last-child)::after {
          content: "·";
          margin-left: 12px;
          color: var(--border);
        }
        .dt-card__location { color: var(--ink); font-weight: 500; }

        .dt-card__divider {
          height: 1px;
          background: var(--border);
          margin: 10px 0;
        }

        .dt-card__seller {
          display: block;
          color: var(--muted);
          font-size: 0.78rem;
          line-height: 1.5;
        }
        .dt-card__seller-verified { color: var(--forest-light); font-weight: 600; }
        .dt-card__contact {
          display: block;
          margin-top: 4px;
          font-size: 0.78rem;
          color: var(--forest);
          font-weight: 600;
        }

        @keyframes dtFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .dt-hero__inner, .dt-search, .dt-card, .dt-btn, .dt-card__media img {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (max-width: 640px) {
          .dt-hero { padding: 64px 18px 110px; }
          .dt-search-wrap { margin-top: -70px; }
          .dt-search { padding: 24px 20px 20px; }
          .dt-hero__actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
