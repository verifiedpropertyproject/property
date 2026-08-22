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
          Design tokens: dark forest / primary green / gold "seal" accent.
          Type: Fraunces (display, headline only) + Inter (everything else) —
          the serif carries the "trusted marketplace" narrative, the grotesk
          carries the transactional data (price, specs, verification).

          To load the real fonts, add to your root layout <head>:
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
         ========================================================================== */}
      <style>{`
        .dk-page {
          --dk-dark: #0b2e1f;
          --dk-primary: #1f7a4c;
          --dk-primary-hover: #176339;
          --dk-surface: #f6f9f7;
          --dk-card: #ffffff;
          --dk-border: #e3e8e5;
          --dk-ink: #10241c;
          --dk-muted: #5f6f67;
          --dk-gold: #b9872f;
          --dk-gold-bg: #fbf3e4;

          --font-display: "Fraunces", "Iowan Old Style", "Palatino Linotype", Georgia, serif;
          --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;

          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 18px;

          background-color: var(--dk-card);
          color: var(--dk-ink);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .dk-page * { box-sizing: border-box; }

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
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--dk-primary);
          margin-bottom: 14px;
        }
        .dk-kicker::before {
          content: "";
          width: 16px;
          height: 1px;
          background: var(--dk-primary);
        }

        .dk-heading {
          font-family: var(--font-display);
          font-weight: 600;
          font-optical-sizing: auto;
          color: var(--dk-dark);
          margin: 0 0 14px;
          font-size: clamp(28px, 3.4vw, 40px);
          line-height: 1.15;
          letter-spacing: -0.01em;
          word-break: break-word;
          max-width: 20ch;
        }

        .dk-lede {
          color: var(--dk-muted);
          margin: 0;
          line-height: 1.65;
          font-size: 15.5px;
          max-width: 42ch;
        }

        .dk-auth-row {
          margin-top: 22px;
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
          background-color: var(--dk-surface);
          border: 1px solid var(--dk-border);
          border-radius: var(--radius-lg);
          padding: clamp(20px, 3vw, 28px);
        }

        .dk-search-title {
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--dk-dark);
          margin: 0 0 18px;
          font-size: 19px;
        }

        .dk-field-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }

        .dk-field { flex: 1 1 160px; min-width: 140px; display: flex; flex-direction: column; }

        .dk-field-label { color: var(--dk-ink); font-weight: 500; font-size: 12.5px; margin-bottom: 7px; }

        .dk-input {
          padding: 11px 13px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--dk-border);
          width: 100%;
          background-color: var(--dk-card);
          color: var(--dk-ink);
          font-family: var(--font-body);
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dk-input::placeholder { color: #9aa6a0; }
        .dk-input:hover { border-color: #c9d3ce; }
        .dk-input:focus-visible {
          outline: none;
          border-color: var(--dk-primary);
          box-shadow: 0 0 0 3px rgba(31, 122, 76, 0.16);
        }

        .dk-search-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 18px; }

        .dk-submit-btn {
          background-color: var(--dk-primary);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          padding: 12px 28px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .dk-submit-btn:hover { background-color: var(--dk-primary-hover); box-shadow: 0 6px 16px rgba(31, 122, 76, 0.28); }
        .dk-submit-btn:active { transform: scale(0.97); }
        .dk-submit-btn:focus-visible { outline: 2px solid var(--dk-primary); outline-offset: 3px; }

        .dk-clear-link {
          color: var(--dk-primary);
          font-weight: 500;
          font-size: 14px;
          text-decoration: none;
          opacity: 0.85;
          transition: opacity 0.2s ease;
        }
        .dk-clear-link:hover { opacity: 1; text-decoration: underline; }

        @media (max-width: 640px) {
          .dk-search-actions { flex-direction: column; align-items: stretch; }
          .dk-search-actions button, .dk-search-actions a { width: 100%; text-align: center; }
        }

        .dk-divider { border: none; border-top: 1px solid var(--dk-border); margin: 36px 0 32px; }

        .dk-listings-heading {
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--dk-dark);
          margin-bottom: 20px;
          font-size: 22px;
        }

        .dk-empty-state {
          color: var(--dk-muted);
          background: var(--dk-surface);
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
          box-shadow: 0 1px 2px rgba(11, 46, 31, 0.04);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .dk-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 28px rgba(11, 46, 31, 0.12);
          border-color: #bcd8c8;
        }

        .dk-card-img-wrap {
          overflow: hidden;
          border-radius: var(--radius-md);
          margin-bottom: 12px;
          display: block;
          background: var(--dk-surface);
        }
        .dk-card-img { width: 100%; height: 168px; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .dk-card:hover .dk-card-img { transform: scale(1.06); }

        .dk-badge-row { margin-bottom: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }

        .dk-badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 5px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          line-height: 1.4;
        }
        .dk-badge-featured { background-color: var(--dk-dark); color: #ffffff; }
        .dk-badge-availability { background-color: var(--dk-surface); color: var(--dk-primary); border: 1px solid var(--dk-border); }

        /* Signature element: a stamped, slightly-rotated "verified seal" with a
           dashed ring — reads as "this listing has been notarized," which is
           the one thing this marketplace is actually selling. */
        .dk-seal {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: var(--dk-gold-bg);
          color: var(--dk-gold);
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

        .dk-price {
          color: var(--dk-primary);
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 19px;
          margin-bottom: 7px;
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

        .dk-save-wrap { margin-top: auto; padding-top: 12px; }

        .dk-page a:focus-visible,
        .dk-page button:focus-visible,
        .dk-page select:focus-visible {
          outline: 2px solid var(--dk-primary);
          outline-offset: 2px;
        }
      `}</style>

      <div className="dk-container">
        {/* ---------- Hero: intro + search panel ---------- */}
        <div className="dk-hero">
          <header className="dk-hero-intro">
            <span className="dk-kicker">Verified property, East Africa</span>
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

            <form method="get">
              <div className="dk-field-grid">
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

                <div className="dk-field">
                  <label className="dk-field-label">Property type</label>
                  <select name="propertyType" defaultValue={searchParams.propertyType || ""} className="dk-input">
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PROPERTY_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dk-field">
                  <label className="dk-field-label">Buy or rent</label>
                  <select name="listingType" defaultValue={searchParams.listingType || ""} className="dk-input">
                    <option value="">Any</option>
                    <option value="SALE">For sale</option>
                    <option value="RENT">For rent</option>
                  </select>
                </div>

                <div className="dk-field">
                  <label className="dk-field-label">Availability</label>
                  <select
                    name="availabilityStatus"
                    defaultValue={searchParams.availabilityStatus || ""}
                    className="dk-input"
                  >
                    <option value="">Any</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>

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
                    <Link href={`/properties/${p.id}`} className="dk-card-img-wrap">
                      <img src={p.imageUrl} alt={p.title} className="dk-card-img" />
                    </Link>
                  )}

                  <div className="dk-badge-row">
                    {p.featured && <span className="dk-badge dk-badge-featured">Featured</span>}
                    {p.daktopVerified && <VerifiedSeal />}
                    <span className="dk-badge dk-badge-availability">
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
                  </small>

                  {p.showContact && p.seller.phone && (
                    <small className="dk-contact-info">Contact: {p.seller.phone}</small>
                  )}

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
