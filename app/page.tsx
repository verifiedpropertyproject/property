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
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
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
  fontWeight: 500,
  fontSize: "13px",
  marginBottom: "6px",
};

const fieldInputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  boxSizing: "border-box",
  fontSize: "14px",
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
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dk-hero { animation: fadeIn 0.5s ease both; }

        .dk-card {
          animation: fadeInUp 0.45s ease both;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .dk-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(11,46,31,0.12);
          border-color: ${COLORS.primaryGreen}55;
        }

        .dk-card-img-wrap { overflow: hidden; border-radius: 8px; }
        .dk-card-img {
          transition: transform 0.4s ease;
        }
        .dk-card:hover .dk-card-img {
          transform: scale(1.06);
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
          box-shadow: 0 4px 12px rgba(31,122,76,0.35);
        }
        .dk-btn:active {
          transform: scale(0.97);
        }

        .dk-link {
          transition: color 0.2s ease;
        }
        .dk-link:hover {
          color: ${COLORS.primaryGreenHover};
          text-decoration: underline;
        }

        .dk-input:focus, .dk-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }

        .dk-clear-link {
          transition: opacity 0.2s ease;
        }
        .dk-clear-link:hover {
          opacity: 0.7;
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
          marginBottom: "28px",
        }}
      >
        {/* Left column — intro / account access */}
        <header style={{ flex: "1 1 280px", minWidth: "0" }}>
          <h1
            style={{
              color: COLORS.darkGreen,
              marginBottom: "10px",
              fontSize: "clamp(22px, 3vw, 28px)",
              lineHeight: 1.25,
              wordBreak: "break-word",
            }}
          >
            East Africa&apos;s Trusted Marketplace for Verified Properties
          </h1>
          <p style={{ color: COLORS.textGray, margin: 0, lineHeight: 1.6 }}>
            Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
          </p>

          {session?.user ? (
            <p style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <NotificationBell />
              <Link href="/dashboard" className="dk-link" style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}>
                Go to your dashboard
              </Link>
            </p>
          ) : (
            <p style={{ marginTop: "16px" }}>
              <Link href="/login" className="dk-link" style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}>
                Log in
              </Link>{" "}
              |{" "}
              <Link href="/register" className="dk-link" style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}>
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
            borderRadius: "14px",
            padding: "clamp(16px, 3vw, 24px)",
          }}
        >
          <h2 style={{ color: COLORS.darkGreen, marginTop: 0, marginBottom: "14px", fontSize: "18px" }}>
            Find a Property
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

            <div className="dk-search-btn-row" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
              <button
                type="submit"
                className="dk-btn"
                style={{
                  backgroundColor: COLORS.primaryGreen,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 26px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Search Properties
              </button>
              <a href="/" className="dk-clear-link" style={{ color: COLORS.primaryGreen, fontWeight: 500, textDecoration: "none" }}>
                Clear filters
              </a>
            </div>
          </form>
        </section>
      </div>
      {/* end hero */}

      <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "28px 0" }} />

      {/* ---------- Listings section — responsive grid ---------- */}
      <section>
        <h2 style={{ color: COLORS.darkGreen, marginBottom: "18px" }}>
          Verified Listings ({properties.length})
        </h2>

        {properties.length === 0 ? (
          <p style={{ color: COLORS.textGray }}>No properties match your search. Try adjusting your filters.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
              gap: "20px",
            }}
          >
            {properties.map((p: PropertyWithSeller, index: number) => (
              <li
                key={p.id}
                className="dk-card"
                style={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "14px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  animationDelay: `${Math.min(index, 10) * 0.06}s`,
                }}
              >
                {/* Image */}
                {p.imageUrl && (
                  <Link href={`/properties/${p.id}`} className="dk-card-img-wrap" style={{ marginBottom: "10px", display: "block" }}>
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
                <div style={{ marginBottom: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {p.featured && (
                    <span
                      style={{
                        backgroundColor: COLORS.darkGreen,
                        color: COLORS.white,
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      FEATURED
                    </span>
                  )}
                  {p.daktopVerified && (
                    <span
                      style={{
                        backgroundColor: COLORS.primaryGreen,
                        color: COLORS.white,
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      DAKTOP VERIFIED
                    </span>
                  )}
                  <span
                    style={{
                      backgroundColor: COLORS.lightGreenBg,
                      color: COLORS.primaryGreen,
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
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
                <div style={{ margin: "6px 0", fontSize: "13px", color: COLORS.textGray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: p.verified ? COLORS.primaryGreen : COLORS.textGray, fontWeight: 600 }}>
                    {p.verified ? "Verified" : "Not Verified"}
                  </span>{" "}
                  — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} —{" "}
                  {p.listingType === "SALE" ? "For sale" : "For rent"}
                </div>

                {/* Price */}
                <div style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "17px", marginBottom: "6px" }}>
                  KSh {p.price.toLocaleString()}
                </div>

                {/* Location + specs */}
                <div
                  style={{
                    color: COLORS.textGray,
                    fontSize: "13px",
                    marginBottom: "8px",
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
                <small style={{ color: COLORS.textGray, display: "block", overflowWrap: "break-word" }}>
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