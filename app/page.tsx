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
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#EAF7EF",
  pageBg: "#FBFCFB",
  sectionBg: "#FFFFFF",
  textDark: "#0F172A",
  textGray: "#64748B",
  textMuted: "#94A3B8",
  border: "#E7EBEF",
  borderSoft: "#F0F2F5",
  white: "#FFFFFF",
  amber: "#B45309",
  amberBg: "#FEF3E2",
};

const fieldWrapperStyle: React.CSSProperties = {
  flex: "1 1 160px",
  minWidth: "140px",
  display: "flex",
  flexDirection: "column",
};

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.textGray,
  fontWeight: 600,
  fontSize: "12px",
  marginBottom: "7px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const fieldInputStyle: React.CSSProperties = {
  padding: "11px 13px",
  borderRadius: "10px",
  border: `1.5px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  backgroundColor: COLORS.white,
  boxSizing: "border-box",
  fontSize: "14px",
  fontFamily: "inherit",
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

  let savedPropertyIds = new Set<string>();
  if (session?.user?.role === "BUYER") {
    const saved = await prisma.savedProperty.findMany({
      where: { buyerId: session.user.id },
      select: { propertyId: true },
    });
    savedPropertyIds = new Set(saved.map((s: { propertyId: string }) => s.propertyId));
  }

  return (
    <div style={{ backgroundColor: COLORS.pageBg, overflowX: "hidden", minHeight: "100vh" }}>

      <div
        style={{
          color: COLORS.textDark,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
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
          box-shadow: 0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.03);
        }
        .dk-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 30px -10px rgba(11,46,31,0.15), 0 4px 10px rgba(11,46,31,0.06);
          border-color: ${COLORS.primaryGreen}66;
        }

        .dk-card-img-wrap { overflow: hidden; border-radius: 10px; position: relative; }
        .dk-card-img { transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .dk-card:hover .dk-card-img { transform: scale(1.07); }

        .dk-title {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }
        .dk-card:hover .dk-title { color: ${COLORS.primaryGreen}; }

        .dk-btn {
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          box-shadow: 0 1px 2px rgba(11,46,31,0.15);
        }
        .dk-btn:hover {
          background-color: ${COLORS.primaryGreenHover};
          box-shadow: 0 8px 16px rgba(31,122,76,0.28);
          transform: translateY(-1px);
        }
        .dk-btn:active { transform: scale(0.97) translateY(0); }

        .dk-link { transition: color 0.2s ease; }
        .dk-link:hover { color: ${COLORS.primaryGreenHover}; text-decoration: underline; }

        .dk-input:hover { border-color: ${COLORS.primaryGreen}88 !important; }
        .dk-input:focus, .dk-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 4px ${COLORS.primaryGreen}1A;
        }

        .dk-clear-link { transition: opacity 0.2s ease, color 0.2s ease; }
        .dk-clear-link:hover { opacity: 0.75; }

        .dk-icon-btn { transition: background-color 0.2s ease, transform 0.15s ease; }
        .dk-icon-btn:hover { background-color: ${COLORS.lightGreenBg}; transform: translateY(-1px); }

        ::selection { background-color: ${COLORS.primaryGreen}33; }

        @media (max-width: 640px) {
          .dk-search-btn-row { flex-direction: column; align-items: stretch !important; }
          .dk-search-btn-row button { width: 100%; }
          .dk-search-btn-row a { text-align: center; }
        }
      `}</style>

      {/* ---------- Hero ---------- */}
      <div
        className="dk-hero"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          alignItems: "flex-start",
          marginBottom: "36px",
        }}
      >
        <header style={{ flex: "1 1 280px", minWidth: "0", paddingTop: "4px" }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: COLORS.lightGreenBg,
              color: COLORS.primaryGreen,
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px",
              letterSpacing: "0.04em",
              marginBottom: "14px",
            }}
          >
            TRUSTED · VERIFIED · EAST AFRICA
          </div>
          <h1
            style={{
              color: COLORS.darkGreen,
              marginBottom: "12px",
              marginTop: 0,
              fontSize: "clamp(24px, 3.2vw, 32px)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              fontWeight: 700,
              wordBreak: "break-word",
            }}
          >
            East Africa&apos;s Trusted Marketplace for Verified Properties
          </h1>
          <p style={{ color: COLORS.textGray, margin: 0, lineHeight: 1.65, fontSize: "15px", maxWidth: "480px" }}>
            Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
          </p>

          {session?.user ? (
            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="dk-icon-btn" style={{ borderRadius: "10px", padding: "4px" }}>
                <NotificationBell />
              </div>
              <Link
                href="/dashboard"
                className="dk-link"
                style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none", fontSize: "14px" }}
              >
                Go to your dashboard →
              </Link>
            </div>
          ) : (
            <div style={{ marginTop: "22px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/register"
                className="dk-btn"
                style={{
                  backgroundColor: COLORS.primaryGreen,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: "10px",
                  padding: "11px 22px",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Create an account
              </Link>
              <Link
                href="/login"
                className="dk-link"
                style={{
                  color: COLORS.textDark,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "14px",
                  padding: "11px 18px",
                  border: `1.5px solid ${COLORS.border}`,
                  borderRadius: "10px",
                }}
              >
                Log in
              </Link>
            </div>
          )}
        </header>

        <section
          style={{
            flex: "3 1 560px",
            minWidth: "0",
            width: "100%",
            backgroundColor: COLORS.sectionBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "18px",
            padding: "clamp(18px, 3vw, 26px)",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 12px 28px -14px rgba(15,23,42,0.08)",
          }}
        >
          <h2
            style={{
              color: COLORS.darkGreen,
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Find a Property
          </h2>

          <form method="get">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
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
                  borderRadius: "10px",
                  padding: "12px 28px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Search Properties
              </button>
              
                href="/"
                className="dk-clear-link"
                style={{ color: COLORS.textGray, fontWeight: 500, textDecoration: "none", fontSize: "13.5px" }}
              >
                Clear filters
              </a>
            </div>
          </form>
        </section>
      </div>
      {/* end hero */}

      <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${COLORS.border}, transparent)`, margin: "32px 0" }} />

      {/* ---------- Listings ---------- */}
      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          <h2 style={{ color: COLORS.darkGreen, margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Verified Listings
          </h2>
          <span style={{ color: COLORS.textMuted, fontSize: "13.5px", fontWeight: 500 }}>
            {properties.length} {properties.length === 1 ? "result" : "results"}
          </span>
        </div>

        {properties.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              backgroundColor: COLORS.sectionBg,
              border: `1px dashed ${COLORS.border}`,
              borderRadius: "16px",
              color: COLORS.textGray,
            }}
          >
            No properties match your search. Try adjusting your filters.
          </div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 270px), 1fr))",
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
                  animationDelay: `${Math.min(index, 10) * 0.05}s`,
                }}
              >
                {p.imageUrl && (
                  <Link href={`/properties/${p.id}`} className="dk-card-img-wrap" style={{ marginBottom: "12px", display: "block" }}>
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="dk-card-img"
                      style={{ width: "100%", height: "170px", objectFit: "cover", display: "block" }}
                    />
                  </Link>
                )}

                <div style={{ marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {p.featured && (
                    <span
                      style={{
                        backgroundColor: COLORS.darkGreen,
                        color: COLORS.white,
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "4px 9px",
                        borderRadius: "6px",
                        letterSpacing: "0.03em",
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
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "4px 9px",
                        borderRadius: "6px",
                        letterSpacing: "0.03em",
                      }}
                    >
                      DAKTOP VERIFIED
                    </span>
                  )}
                  <span
                    style={{
                      backgroundColor: COLORS.lightGreenBg,
                      color: COLORS.primaryGreen,
                      fontSize: "10.5px",
                      fontWeight: 700,
                      padding: "4px 9px",
                      borderRadius: "6px",
                    }}
                  >
                    {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                  </span>
                </div>

                <Link href={`/properties/${p.id}`} style={{ textDecoration: "none" }}>
                  <strong
                    className="dk-title"
                    style={{ color: COLORS.textDark, fontSize: "15.5px", lineHeight: 1.35, fontWeight: 650 }}
                  >
                    {p.title}
                  </strong>
                </Link>

                <div
                  style={{
                    margin: "7px 0",
                    fontSize: "12.5px",
                    color: COLORS.textGray,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: p.verified ? COLORS.primaryGreen : COLORS.textMuted, fontWeight: 600 }}>
                    {p.verified ? "Verified" : "Not Verified"}
                  </span>{" "}
                  · {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} ·{" "}
                  {p.listingType === "SALE" ? "For sale" : "For rent"}
                </div>

                <div style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "18px", letterSpacing: "-0.01em", marginBottom: "8px" }}>
                  KSh {p.price.toLocaleString()}
                </div>

                <div
                  style={{
                    color: COLORS.textGray,
                    fontSize: "13px",
                    marginBottom: "10px",
                    paddingBottom: "10px",
                    borderBottom: `1px solid ${COLORS.borderSoft}`,
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

                <small style={{ color: COLORS.textGray, display: "block", overflowWrap: "break-word", fontSize: "12.5px", lineHeight: 1.5 }}>
                  Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
                  {p.seller.verified && (
                    <span style={{ color: COLORS.primaryGreen, fontWeight: 600 }}>
                      {" "}
                      · Verified {getRoleLabel(p.seller.role)}
                    </span>
                  )}
                  {p.representingName && <> · representing {p.representingName}</>}
                </small>

                {p.showContact && p.seller.phone && (
                  <small style={{ color: COLORS.textDark, display: "block", marginTop: "6px", fontSize: "12.5px", fontWeight: 500 }}>
                    Contact: {p.seller.phone}
                  </small>
                )}

                {session?.user?.role === "BUYER" && (
                  <div style={{ marginTop: "auto", paddingTop: "12px" }}>
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