import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel } from "@/lib/propertyConstants";

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

// Reusable field style so every input/select lines up the same way
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
    <div
      style={{
        backgroundColor: COLORS.pageBg,
        color: COLORS.textDark,
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      {/* ---------- Hero: intro (1fr) + search panel (3fr), side by side on desktop ---------- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        {/* Left column — intro / account access */}
        <header style={{ flex: "1 1 280px", minWidth: "260px" }}>
          <h1 style={{ color: COLORS.darkGreen, marginBottom: "10px", fontSize: "28px", lineHeight: 1.2 }}>
            Kenya&apos;s Trusted Marketplace for Verified Properties
          </h1>
          <p style={{ color: COLORS.textGray, margin: 0 }}>
            Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
          </p>

          {session?.user ? (
            <p style={{ marginTop: "16px" }}>
              <Link href="/dashboard" style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}>
                Go to your dashboard
              </Link>
            </p>
          ) : (
            <p style={{ marginTop: "16px" }}>
              <Link href="/login" style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}>
                Log in
              </Link>{" "}
              |{" "}
              <Link href="/register" style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}>
                Create an account
              </Link>
            </p>
          )}
        </header>

        {/* Right column — search panel */}
        <section
          style={{
            flex: "3 1 560px",
            minWidth: "300px",
            backgroundColor: COLORS.sectionBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2 style={{ color: COLORS.darkGreen, marginTop: 0, marginBottom: "14px", fontSize: "18px" }}>
            Find a Property
          </h2>

          <form method="get">
            {/* Fields laid out horizontally, wrapping only on narrow screens */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "16px",
              }}
            >
              <div style={fieldWrapperStyle}>
                <label style={fieldLabelStyle}>Location / County</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={searchParams.location}
                  placeholder="e.g. Kitengela"
                  style={fieldInputStyle}
                />
              </div>

              <div style={fieldWrapperStyle}>
                <label style={fieldLabelStyle}>Property Type</label>
                <select name="propertyType" defaultValue={searchParams.propertyType || ""} style={fieldInputStyle}>
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
                <select name="listingType" defaultValue={searchParams.listingType || ""} style={fieldInputStyle}>
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
                  style={fieldInputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                type="submit"
                style={{
                  backgroundColor: COLORS.primaryGreen,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Search Properties
              </button>
              <a href="/" style={{ color: COLORS.primaryGreen, fontWeight: 500, textDecoration: "none" }}>
                Clear filters
              </a>
            </div>
          </form>
        </section>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "24px 0" }} />

      {/* ---------- Listings section — responsive grid, not a stacked list ---------- */}
      <section>
        <h2 style={{ color: COLORS.darkGreen, marginBottom: "16px" }}>
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
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {properties.map((p: PropertyWithSeller) => (
              <li
                key={p.id}
                style={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Image */}
                {p.imageUrl && (
                  <Link href={`/properties/${p.id}`} style={{ marginBottom: "10px" }}>
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      style={{
                        width: "100%",
                        height: "160px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        display: "block",
                      }}
                    />
                  </Link>
                )}

                {/* Status badges */}
                <div style={{ marginBottom: "8px" }}>
                  {p.featured && (
                    <span
                      style={{
                        backgroundColor: COLORS.darkGreen,
                        color: COLORS.white,
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        marginRight: "6px",
                      }}
                    >
                      FEATURED
                    </span>
                  )}
                  <span
                    style={{
                      backgroundColor: COLORS.lightGreenBg,
                      color: COLORS.primaryGreen,
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                  </span>
                </div>

                {/* Title */}
                <Link href={`/properties/${p.id}`} style={{ textDecoration: "none" }}>
                  <strong style={{ color: COLORS.textDark, fontSize: "16px" }}>{p.title}</strong>
                </Link>

                {/* Verified / type / listing type */}
                <div style={{ margin: "6px 0", fontSize: "14px" }}>
                  <span style={{ color: p.verified ? COLORS.primaryGreen : COLORS.textGray, fontWeight: 600 }}>
                    {p.verified ? "Verified" : "Not Verified"}
                  </span>{" "}
                  — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} —{" "}
                  {p.listingType === "SALE" ? "For sale" : "For rent"}
                </div>

                {/* Price */}
                <div style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>
                  KSh {p.price.toLocaleString()}
                </div>

                {/* Location + specs */}
                <div style={{ color: COLORS.textGray, fontSize: "14px", marginBottom: "8px" }}>
                  {p.location}
                  {p.bedrooms !== null && <> — {p.bedrooms} bed</>}
                  {p.bathrooms !== null && <> — {p.bathrooms} bath</>}
                  {p.acreage !== null && <> — {p.acreage} acres</>}
                </div>

                {/* Seller info */}
                <small style={{ color: COLORS.textGray, display: "block" }}>
                  Listed by {p.seller.name || p.seller.email} ({p.seller.role === "AGENT" ? "Agent" : "Owner"})
                  {p.seller.verified && (
                    <span style={{ color: COLORS.primaryGreen }}>
                      {" "}
                      — Verified {p.seller.role === "AGENT" ? "Agent" : "Owner"}
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
    </div>
  );
}