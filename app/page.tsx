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

// --- Color palette ---
// Rooted in land/surveying: deep forest for trust, warm sand for paper/ground,
// and an ochre accent (deliberately not the common AI-default terracotta) for
// featured/premium signals — evoking a surveyor's ink stamp.
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#155C36",
  lightGreenBg: "#EAF3EC",
  pageBg: "#FFFFFF",
  sectionBg: "#FAF8F3",
  ink: "#16231C",
  stone: "#6E6759",
  border: "#E7E2D6",
  gold: "#A97A2E",
  goldSoft: "#F4E9D6",
  white: "#FFFFFF",
};

const fieldWrapperStyle: React.CSSProperties = {
  flex: "1 1 160px",
  minWidth: "140px",
  display: "flex",
  flexDirection: "column",
};

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.stone,
  fontWeight: 600,
  fontSize: "11px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "7px",
};

const fieldInputStyle: React.CSSProperties = {
  padding: "11px 13px",
  borderRadius: "9px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.white,
  width: "100%",
  color: COLORS.ink,
  boxSizing: "border-box",
  fontSize: "14.5px",
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
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
          color: COLORS.ink,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
      {/* Fonts + global styles for hover states, animations, and type treatment
          (can't be done with inline style objects) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,560;9..144,650&family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .dk-root, .dk-root * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .dk-display {
          font-family: 'Fraunces', Georgia, serif;
          font-optical-sizing: auto;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dk-hero { animation: fadeIn 0.6s ease both; }

        .dk-card {
          animation: fadeInUp 0.5s ease both;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
          box-shadow: 0 1px 2px rgba(11,46,31,0.04);
        }
        .dk-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 32px -12px rgba(11,46,31,0.18);
          border-color: ${COLORS.primaryGreen}66;
        }

        .dk-card-img-wrap { overflow: hidden; border-radius: 10px; position: relative; }
        .dk-card-img {
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .dk-card:hover .dk-card-img {
          transform: scale(1.055);
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

        .dk-btn {
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        .dk-btn:hover {
          background-color: ${COLORS.primaryGreenHover};
          box-shadow: 0 6px 16px -4px rgba(31,122,76,0.4);
        }
        .dk-btn:active {
          transform: scale(0.97);
        }

        .dk-link {
          transition: color 0.2s ease, text-decoration-color 0.2s ease;
        }
        .dk-link:hover {
          color: ${COLORS.primaryGreenHover};
        }

        .dk-input:focus, .dk-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}1F;
        }

        .dk-clear-link {
          transition: opacity 0.2s ease;
        }
        .dk-clear-link:hover {
          opacity: 0.65;
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

      <div className="dk-root">

      {/* ---------- Hero: intro (1fr) + search panel (3fr), side by side on desktop ---------- */}
      <div
        className="dk-hero"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        {/* Left column — intro / account access */}
        <header style={{ flex: "1 1 280px", minWidth: "0" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: COLORS.gold,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            <span style={{ width: "18px", height: "1px", backgroundColor: COLORS.gold, display: "inline-block" }} />
            Daktop360 Marketplace
          </div>
          <h1
            className="dk-display"
            style={{
              color: COLORS.darkGreen,
              marginBottom: "14px",
              fontSize: "clamp(26px, 3.4vw, 34px)",
              fontWeight: 600,
              lineHeight: 1.18,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
            }}
          >
            East Africa&apos;s trusted marketplace for verified properties
          </h1>
          <p style={{ color: COLORS.stone, margin: 0, lineHeight: 1.65, fontSize: "15px", maxWidth: "42ch" }}>
            Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
          </p>

          {session?.user ? (
            <p style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="dk-link"
                style={{
                  color: COLORS.primaryGreen,
                  fontWeight: 600,
                  fontSize: "14.5px",
                  textDecoration: "underline",
                  textDecorationColor: `${COLORS.primaryGreen}55`,
                  textUnderlineOffset: "3px",
                }}
              >
                Go to your dashboard →
              </Link>
            </p>
          ) : (
            <p style={{ marginTop: "22px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/login"
                className="dk-link"
                style={{
                  color: COLORS.white,
                  backgroundColor: COLORS.darkGreen,
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="dk-link"
                style={{
                  color: COLORS.darkGreen,
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                Create an account
              </Link>
            </p>
          )}
        </header>

        {/* Right column — search panel */}
        <section
          style={{
            flex: "3 1 560px",
            minWidth: "0",
            width: "100%",
            backgroundColor: COLORS.sectionBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "16px",
            padding: "clamp(18px, 3vw, 26px)",
            boxShadow: "0 2px 10px rgba(11,46,31,0.04)",
          }}
        >
          <h2
            className="dk-display"
            style={{ color: COLORS.darkGreen, marginTop: 0, marginBottom: "16px", fontSize: "19px", fontWeight: 600 }}
          >
            Find a property
          </h2>

          <form method="get">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "18px",
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
                  style={fieldInputStyle}
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
                  style={fieldInputStyle}
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
                  style={fieldInputStyle}
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
                  borderRadius: "9px",
                  padding: "12px 28px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Search Properties
              </button>
              <a
                href="/"
                className="dk-clear-link"
                style={{ color: COLORS.stone, fontWeight: 500, fontSize: "13.5px", textDecoration: "none" }}
              >
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
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "20px" }}>
          <h2 className="dk-display" style={{ color: COLORS.darkGreen, margin: 0, fontSize: "22px", fontWeight: 600 }}>
            Verified Listings
          </h2>
          <span style={{ color: COLORS.stone, fontSize: "14px" }}>({properties.length})</span>
        </div>

        {properties.length === 0 ? (
          <p style={{ color: COLORS.stone, fontSize: "14.5px" }}>No properties match your search. Try adjusting your filters.</p>
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
                <div style={{ marginBottom: "9px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {p.featured && (
                    <span
                      style={{
                        backgroundColor: COLORS.goldSoft,
                        color: COLORS.gold,
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "3.5px 9px",
                        borderRadius: "20px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      FEATURED
                    </span>
                  )}
                  {p.daktopVerified && (
                    <span
                      style={{
                        backgroundColor: COLORS.darkGreen,
                        color: COLORS.white,
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "3.5px 9px",
                        borderRadius: "20px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      ✓ DAKTOP VERIFIED
                    </span>
                  )}
                  <span
                    style={{
                      backgroundColor: COLORS.lightGreenBg,
                      color: COLORS.primaryGreen,
                      fontSize: "10.5px",
                      fontWeight: 700,
                      padding: "3.5px 9px",
                      borderRadius: "20px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                  </span>
                </div>

                {/* Title */}
                <Link href={`/properties/${p.id}`} style={{ textDecoration: "none" }}>
                  <strong
                    className="dk-title dk-display"
                    style={{ color: COLORS.ink, fontSize: "16.5px", fontWeight: 600, lineHeight: 1.32, display: "-webkit-box" }}
                  >
                    {p.title}
                  </strong>
                </Link>

                {/* Verified / type / listing type */}
                <div style={{ margin: "7px 0", fontSize: "12.5px", color: COLORS.stone, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: p.verified ? COLORS.primaryGreen : COLORS.stone, fontWeight: 600 }}>
                    {p.verified ? "Verified" : "Not Verified"}
                  </span>{" "}
                  · {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} ·{" "}
                  {p.listingType === "SALE" ? "For sale" : "For rent"}
                </div>

                {/* Price */}
                <div className="dk-display" style={{ color: COLORS.darkGreen, fontWeight: 600, fontSize: "18px", marginBottom: "7px" }}>
                  KSh {p.price.toLocaleString()}
                </div>

                {/* Location + specs */}
                <div
                  style={{
                    color: COLORS.stone,
                    fontSize: "12.5px",
                    marginBottom: "9px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.location}
                  {p.bedrooms !== null && <> · {p.bedrooms} bed</>}
                  {p.bathrooms !== null && <> · {p.bathrooms} bath</>}
                  {p.acreage !== null && <> · {p.acreage} acres</>}
                </div>

                {/* Seller info */}
                <small style={{ color: COLORS.stone, fontSize: "12px", display: "block", overflowWrap: "break-word" }}>
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
                  <small style={{ color: COLORS.ink, fontSize: "12.5px", fontWeight: 500, display: "block", marginTop: "5px" }}>
                    Contact: {p.seller.phone}
                  </small>
                )}

                {/* Save button (buyers only) — pushed to bottom of card */}
                {session?.user?.role === "BUYER" && (
                  <div style={{ marginTop: "auto", paddingTop: "11px" }}>
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

    </div>
  );
}
