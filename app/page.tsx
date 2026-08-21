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

// --- Color palette (matches the Daktop360 reference design) ---
const COLORS = {
  darkGreen: "#0B2E1F",
  darkGreen2: "#0F3D29",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  accentGold: "#D9A441",
  accentGoldHover: "#C1902F",
  lightGreenBg: "#E8F5EC",
  pageBg: "#FFFFFF",
  sectionBg: "#F7FAF8",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

const fieldWrapperStyle: React.CSSProperties = {
  flex: "1 1 160px",
  minWidth: "140px",
  display: "flex",
  flexDirection: "column",
};

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 600,
  fontSize: "12.5px",
  marginBottom: "7px",
  letterSpacing: "0.01em",
};

const fieldInputStyle: React.CSSProperties = {
  padding: "11px 13px",
  borderRadius: "10px",
  border: `1.5px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  boxSizing: "border-box",
  fontSize: "14px",
  background: COLORS.white,
  transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
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
    <div style={{ backgroundColor: COLORS.pageBg, overflowX: "hidden" }}>

      <div
        style={{
          color: COLORS.textDark,
          fontFamily: "system-ui, -apple-system, sans-serif",
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
      {/* Global styles for hover states + animations (can't be done with inline style objects) */}
      <style>{`
        * { box-sizing: border-box; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes floatGlow {
          0%, 100% { opacity: 0.55; transform: translate(0, 0) scale(1); }
          50% { opacity: 0.9; transform: translate(10px, -10px) scale(1.05); }
        }

        .dk-hero { animation: fadeIn 0.6s ease both; position: relative; }

        .dk-hero-glow {
          position: absolute;
          top: -60px;
          right: -40px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, ${COLORS.primaryGreen}33 0%, transparent 70%);
          filter: blur(10px);
          pointer-events: none;
          animation: floatGlow 7s ease-in-out infinite;
          z-index: 0;
        }

        .dk-card {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
          box-shadow: 0 1px 3px rgba(11,46,31,0.06);
          position: relative;
          isolation: isolate;
        }
        .dk-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 32px -8px rgba(11,46,31,0.18), 0 4px 10px rgba(11,46,31,0.08);
          border-color: ${COLORS.primaryGreen}66;
        }

        .dk-card-img-wrap {
          overflow: hidden;
          border-radius: 10px;
          position: relative;
        }
        .dk-card-img-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(11,46,31,0.28) 100%);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .dk-card:hover .dk-card-img-wrap::after {
          opacity: 1;
        }
        .dk-card-img {
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dk-card:hover .dk-card-img {
          transform: scale(1.07);
        }

        .dk-title {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }
        .dk-card:hover .dk-title {
          color: ${COLORS.primaryGreen};
        }

        .dk-badge {
          transition: transform 0.2s ease;
        }
        .dk-card:hover .dk-badge {
          transform: translateY(-1px);
        }

        .dk-btn {
          position: relative;
          overflow: hidden;
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.25s ease;
        }
        .dk-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: translateX(-120%);
          transition: transform 0.6s ease;
        }
        .dk-btn:hover {
          background-color: ${COLORS.primaryGreenHover};
          box-shadow: 0 8px 20px rgba(31,122,76,0.35);
        }
        .dk-btn:hover::before {
          transform: translateX(120%);
        }
        .dk-btn:active {
          transform: scale(0.97);
        }

        .dk-link {
          transition: color 0.2s ease;
          position: relative;
        }
        .dk-link:hover {
          color: ${COLORS.primaryGreenHover};
        }
        .dk-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0;
          height: 1.5px;
          background: currentColor;
          transition: width 0.25s ease;
        }
        .dk-link:hover::after {
          width: 100%;
        }

        .dk-input:hover {
          border-color: ${COLORS.primaryGreen}88 !important;
        }
        .dk-input:focus, .dk-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 4px ${COLORS.primaryGreen}1f;
          transform: translateY(-1px);
        }

        .dk-clear-link {
          transition: opacity 0.2s ease, transform 0.2s ease;
          display: inline-block;
        }
        .dk-clear-link:hover {
          opacity: 0.7;
          transform: translateX(2px);
        }

        .dk-search-panel {
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(6px);
        }
        .dk-search-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, ${COLORS.primaryGreen}, ${COLORS.accentGold}, ${COLORS.primaryGreen});
          background-size: 200% 100%;
          animation: shimmer 6s linear infinite;
        }

        .dk-empty {
          animation: fadeInUp 0.4s ease both;
        }

        /* ---------- Responsive refinements ---------- */
        @media (max-width: 640px) {
          .dk-search-btn-row {
            flex-direction: column;
            align-items: stretch !important;
          }
          .dk-search-btn-row button {
            width: 100%;
          }
          .dk-search-btn-row a {
            text-align: center;
          }
        }
      `}</style>

      {/* ---------- Hero: intro (1fr) + search panel (3fr), side by side on desktop ---------- */}
      <div
        className="dk-hero"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "28px",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        <div className="dk-hero-glow" />

        {/* Left column — intro / account access */}
        <header style={{ flex: "1 1 280px", minWidth: "0", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: COLORS.lightGreenBg,
              color: COLORS.primaryGreen,
              fontSize: "11.5px",
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: "999px",
              letterSpacing: "0.04em",
              marginBottom: "14px",
            }}
          >
            EAST AFRICA&apos;S TRUSTED MARKETPLACE
          </div>
          <h1
            style={{
              color: COLORS.darkGreen,
              marginTop: 0,
              marginBottom: "12px",
              fontSize: "clamp(24px, 3.2vw, 30px)",
              lineHeight: 1.22,
              wordBreak: "break-word",
              letterSpacing: "-0.01em",
            }}
          >
            Verified Properties, Bought &amp; Sold with Confidence
          </h1>
          <p style={{ color: COLORS.textGray, margin: 0, lineHeight: 1.65, fontSize: "15px" }}>
            Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
          </p>

          {session?.user ? (
            <p style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="dk-link"
                style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}
              >
                Go to your dashboard →
              </Link>
            </p>
          ) : (
            <p style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/login"
                className="dk-link"
                style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}
              >
                Log in
              </Link>
              <span style={{ color: COLORS.border }}>|</span>
              <Link
                href="/register"
                className="dk-link"
                style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}
              >
                Create an account
              </Link>
            </p>
          )}
        </header>

        {/* Right column — search panel */}
        <section
          className="dk-search-panel"
          style={{
            flex: "3 1 560px",
            minWidth: "0",
            width: "100%",
            backgroundColor: COLORS.sectionBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "16px",
            padding: "clamp(18px, 3vw, 26px)",
            zIndex: 1,
          }}
        >
          <h2
            style={{
              color: COLORS.darkGreen,
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>🔍</span> Find a Property
          </h2>

          <form method="get">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <div style={fieldWrapperStyle}>
                <label style={fieldLabelStyle}>Location / County</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={searchParams.location}
                  placeholder="e.g. Kitengela"
                  className="dk-input"
                  style={fieldInputStyle}
                />
              </div>

              <div style={fieldWrapperStyle}>
                <label style={fieldLabelStyle}>Property Type</label>
                <select
                  name="propertyType"
                  defaultValue={searchParams.propertyType || ""}
                  className="dk-input"
                  style={{ ...fieldInputStyle, cursor: "pointer" }}
                >
                  <option value="">Any type</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PROPERTY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={fieldLabelStyle}>Buy or Rent</label>
                <select
                  name="listingType"
                  defaultValue={searchParams.listingType || ""}
                  className="dk-input"
                  style={{ ...fieldInputStyle, cursor: "pointer" }}
                >
                  <option value="">Any</option>
                  <option value="SALE">For sale</option>
                  <option value="RENT">For rent</option>
                </select>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={fieldLabelStyle}>Availability</label>
                <select
                  name="availabilityStatus"
                  defaultValue={searchParams.availabilityStatus || ""}
                  className="dk-input"
                  style={{ ...fieldInputStyle, cursor: "pointer" }}
                >
                  <option value="">Any</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                  <option value="RENTED">Rented</option>
                </select>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={fieldLabelStyle}>Min Price (KSh)</label>
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={searchParams.minPrice}
                  min="0"
                  placeholder="Any"
                  className="dk-input"
                  style={fieldInputStyle}
                />
              </div>

              <div style={fieldWrapperStyle}>
                <label style={fieldLabelStyle}>Max Price (KSh)</label>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={searchParams.maxPrice}
                  min="0"
                  placeholder="Any"
                  className="dk-input"
                  style={fieldInputStyle}
                />
              </div>
            </div>

            <div className="dk-search-btn-row" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "18px" }}>
              <button
                type="submit"
                className="dk-btn"
                style={{
                  backgroundColor: COLORS.primaryGreen,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 28px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(31,122,76,0.22)",
                }}
              >
                Search Properties
              </button>
              <a href="/" className="dk-clear-link" style={{ color: COLORS.primaryGreen, fontWeight: 500, textDecoration: "none", fontSize: "13.5px" }}>
                Clear filters
              </a>
            </div>
          </form>
        </section>
      </div>
      {/* end hero */}

      <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "32px 0" }} />

      {/* ---------- Listings section — responsive grid ---------- */}
      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          <h2 style={{ color: COLORS.darkGreen, margin: 0, fontSize: "clamp(19px, 2.4vw, 22px)" }}>
            Verified Listings <span style={{ color: COLORS.primaryGreen }}>({properties.length})</span>
          </h2>
        </div>

        {properties.length === 0 ? (
          <div
            className="dk-empty"
            style={{
              textAlign: "center",
              padding: "48px 20px",
              backgroundColor: COLORS.sectionBg,
              borderRadius: "14px",
              border: `1px dashed ${COLORS.border}`,
            }}
          >
            <p style={{ color: COLORS.textGray, margin: 0, fontSize: "15px" }}>
              No properties match your search. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
              gap: "22px",
            }}
          >
            {properties.map((p: PropertyWithSeller, index: number) => (
              <li
                key={p.id}
                className="dk-card"
                style={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "16px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  animationDelay: `${Math.min(index, 10) * 0.06}s`,
                }}
              >
                {/* Image */}
                {p.imageUrl && (
                  <Link href={`/properties/${p.id}`} className="dk-card-img-wrap" style={{ marginBottom: "12px", display: "block" }}>
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="dk-card-img"
                      style={{
                        width: "100%",
                        height: "160px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Link>
                )}

                {/* Status badges */}
                <div style={{ marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {p.featured && (
                    <span
                      className="dk-badge"
                      style={{
                        backgroundColor: COLORS.darkGreen,
                        color: COLORS.white,
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "4px 9px",
                        borderRadius: "999px",
                        letterSpacing: "0.03em",
                      }}
                    >
                      FEATURED
                    </span>
                  )}
                  {p.daktopVerified && (
                    <span
                      className="dk-badge"
                      style={{
                        backgroundColor: COLORS.primaryGreen,
                        color: COLORS.white,
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "4px 9px",
                        borderRadius: "999px",
                        letterSpacing: "0.03em",
                      }}
                    >
                      ✓ DAKTOP VERIFIED
                    </span>
                  )}
                  <span
                    className="dk-badge"
                    style={{
                      backgroundColor: COLORS.lightGreenBg,
                      color: COLORS.primaryGreen,
                      fontSize: "10.5px",
                      fontWeight: 700,
                      padding: "4px 9px",
                      borderRadius: "999px",
                    }}
                  >
                    {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                  </span>
                </div>

                {/* Title */}
                <Link href={`/properties/${p.id}`} style={{ textDecoration: "none" }}>
                  <strong className="dk-title" style={{ color: COLORS.textDark, fontSize: "16px", lineHeight: 1.35 }}>
                    {p.title}
                  </strong>
                </Link>

                {/* Verified / type / listing type */}
                <div style={{ margin: "7px 0", fontSize: "13px", color: COLORS.textGray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: p.verified ? COLORS.primaryGreen : COLORS.textGray, fontWeight: 600 }}>
                    {p.verified ? "Verified" : "Not Verified"}
                  </span>{" "}
                  — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} —{" "}
                  {p.listingType === "SALE" ? "For sale" : "For rent"}
                </div>

                {/* Price */}
                <div style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "18px", marginBottom: "7px", letterSpacing: "-0.01em" }}>
                  KSh {p.price.toLocaleString()}
                </div>

                {/* Location + specs */}
                <div
                  style={{
                    color: COLORS.textGray,
                    fontSize: "13px",
                    marginBottom: "10px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.location}
                  {p.bedrooms !== null && <> — {p.bedrooms} bed</>}
                  {p.bathrooms !== null && <> — {p.bathrooms} bath</>}
                  {p.acreage !== null && <> — {p.acreage} acres</>}
                </div>

                {/* Seller info */}
                <small style={{ color: COLORS.textGray, display: "block", overflowWrap: "break-word", paddingTop: "10px", borderTop: `1px solid ${COLORS.border}` }}>
                  Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
                  {p.seller.verified && (
                    <span style={{ color: COLORS.primaryGreen }}>
                      {" "}
                      — Verified {getRoleLabel(p.seller.role)}
                    </span>
                  )}
                  {p.representingName && <> — representing {p.representingName}</>}
                </small>

                {/* Contact */}
                {p.showContact && p.seller.phone && (
                  <small style={{ color: COLORS.textDark, display: "block", marginTop: "4px" }}>
                    Contact: {p.seller.phone}
                  </small>
                )}

                {/* Save button (buyers only) — pushed to bottom of card */}
                {session?.user?.role === "BUYER" && (
                  <div style={{ marginTop: "auto", paddingTop: "10px" }}>
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
