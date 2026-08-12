import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EnquireForm from "@/components/EnquireForm";
import SaveButton from "@/components/SaveButton";
import AvailabilityForm from "@/components/AvailabilityForm";
import { getPropertyTypeLabel } from "@/lib/propertyConstants";

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
  warnBg: "#FEF6E7",
  warnText: "#92600B",
};

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  padding: "clamp(16px, 3vw, 24px)",
  marginBottom: "24px",
};

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        fontSize: "11px",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: "4px",
        letterSpacing: "0.02em",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      seller: { select: { name: true, email: true, phone: true, role: true, suspended: true, verified: true } },
      _count: { select: { savedBy: true } },
    },
  });

  if (!property) {
    notFound();
  }

  const isOwner = session?.user?.id === property.sellerId;
  const isAdmin = session?.user?.role === "ADMIN";

  // Only the seller, an admin, or anyone if it's approved can view it
  if (property.status !== "APPROVED" && !isOwner && !isAdmin) {
    notFound();
  }

  // A suspended seller's listings are pulled from public view entirely, except for admins
  // who may need to see them for moderation purposes.
  if (property.seller.suspended && !isAdmin) {
    notFound();
  }

  // Count a view for anyone except the owner or an admin browsing their own/managed listing —
  // otherwise checking on your own listing would inflate its own view count.
  if (!isOwner && !isAdmin) {
    try {
      await prisma.property.update({
        where: { id: property.id },
        data: { views: { increment: 1 } },
      });
    } catch {
      // Non-critical — never let a view-count failure break the page.
    }
  }

  let alreadySaved = false;
  if (session?.user?.role === "BUYER") {
    const existing = await prisma.savedProperty.findUnique({
      where: { buyerId_propertyId: { buyerId: session.user.id, propertyId: property.id } },
    });
    alreadySaved = !!existing;
  }

  return (
    <div style={{ backgroundColor: COLORS.pageBg, minHeight: "100vh" }}>
      <div
        style={{
          color: COLORS.textDark,
          fontFamily: "system-ui, -apple-system, sans-serif",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
        <style>{`
          * { box-sizing: border-box; }

          .dk-pd-link {
            color: ${COLORS.primaryGreen};
            font-weight: 600;
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .dk-pd-link:hover {
            color: ${COLORS.primaryGreenHover};
            text-decoration: underline;
          }
        `}</style>

        <p style={{ marginBottom: "20px" }}>
          <Link href="/" className="dk-pd-link">
            &larr; Back to all listings
          </Link>
        </p>

        <section style={sectionCardStyle}>
          {/* Title + badges */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <h1 style={{ color: COLORS.darkGreen, fontSize: "clamp(22px, 3vw, 28px)", margin: 0 }}>
              {property.title}
            </h1>
            {property.featured && <Badge label="FEATURED" bg={COLORS.darkGreen} color={COLORS.white} />}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
            <Badge
              label={property.verified ? "Verified" : "Not Verified"}
              bg={property.verified ? COLORS.lightGreenBg : COLORS.sectionBg}
              color={property.verified ? COLORS.primaryGreen : COLORS.textGray}
            />
            <Badge
              label={AVAILABILITY_LABELS[property.availabilityStatus] || property.availabilityStatus}
              bg={COLORS.lightGreenBg}
              color={COLORS.primaryGreen}
            />
            {property.status !== "APPROVED" && (
              <Badge label={`${property.status} — not yet public`} bg={COLORS.warnBg} color={COLORS.warnText} />
            )}
          </div>

          {(isOwner || isAdmin) && (
            <div style={{ marginBottom: "14px" }}>
              <AvailabilityForm propertyId={property.id} currentStatus={property.availabilityStatus} />
            </div>
          )}

          {property.adminNote && (isOwner || isAdmin) && (
            <p
              style={{
                color: COLORS.warnText,
                backgroundColor: COLORS.warnBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "14px",
                lineHeight: 1.6,
                marginBottom: "14px",
              }}
            >
              Admin note: {property.adminNote}
            </p>
          )}

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "14px", marginBottom: "6px" }}>
            {isOwner && ["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(property.status) && (
              <Link href={`/properties/${property.id}/edit`} className="dk-pd-link">
                Edit this listing
              </Link>
            )}
            {(isOwner || isAdmin) && (
              <Link href={`/properties/${property.id}/documents`} className="dk-pd-link">
                {isOwner ? "Manage supporting documents" : "View supporting documents"}
              </Link>
            )}
          </div>

          {property.imageUrl && (
            <div style={{ margin: "18px 0" }}>
              <img
                src={property.imageUrl}
                alt={property.title}
                width={480}
                style={{ maxWidth: "100%", height: "auto", borderRadius: "10px", display: "block" }}
              />
            </div>
          )}

          <p style={{ color: COLORS.textGray, fontSize: "14px", margin: "0 0 10px 0" }}>
            {getPropertyTypeLabel(property.propertyType, property.propertyTypeOther)} —{" "}
            {property.listingType === "SALE" ? "For sale" : "For rent"}
          </p>

          <p style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "22px", margin: "0 0 14px 0" }}>
            KSh {property.price.toLocaleString()}
          </p>

          <div
            style={{
              backgroundColor: COLORS.sectionBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "16px",
              fontSize: "14px",
              color: COLORS.textDark,
            }}
          >
            <p style={{ margin: "0 0 6px 0" }}>Location: {property.location}</p>
            {property.bedrooms !== null && <p style={{ margin: "0 0 6px 0" }}>Bedrooms: {property.bedrooms}</p>}
            {property.bathrooms !== null && <p style={{ margin: "0 0 6px 0" }}>Bathrooms: {property.bathrooms}</p>}
            {property.acreage !== null && <p style={{ margin: 0 }}>Acreage: {property.acreage}</p>}
          </div>

          <p style={{ color: COLORS.textDark, lineHeight: 1.7, marginBottom: "14px" }}>{property.description}</p>

          <p style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "14px" }}>
            {property.views} views — saved by {property._count.savedBy} buyer{property._count.savedBy === 1 ? "" : "s"}
          </p>

          <p style={{ color: COLORS.textGray, fontSize: "14px", marginBottom: "6px" }}>
            Listed by <strong style={{ color: COLORS.textDark }}>{property.seller.name || property.seller.email}</strong>{" "}
            ({property.seller.role === "AGENT" ? "Agent" : "Property Owner"})
            {property.seller.verified && (
              <> — Verified {property.seller.role === "AGENT" ? "Agent" : "Owner"}</>
            )}
          </p>

          {property.showContact && property.seller.phone ? (
            <p style={{ color: COLORS.textDark, fontSize: "14px", marginBottom: "6px" }}>
              Contact: {property.seller.phone}
            </p>
          ) : (
            (isOwner || isAdmin) && (
              <p style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "6px", fontStyle: "italic" }}>
                Contact is not currently shown to the public for this listing.
              </p>
            )
          )}

          {property.representingName && (
            <p style={{ color: COLORS.textGray, fontSize: "14px", margin: 0 }}>
              Representing: {property.representingName}
              {property.representingContact && <> — {property.representingContact}</>}
            </p>
          )}
        </section>

        {!session?.user && (
          <section style={sectionCardStyle}>
            <p style={{ color: COLORS.textGray, margin: 0 }}>
              <Link href="/login" className="dk-pd-link">
                Log in
              </Link>{" "}
              as a buyer to save this property or contact the seller.
            </p>
          </section>
        )}

        {session?.user?.role === "BUYER" && property.status === "APPROVED" && (
          <section style={sectionCardStyle}>
            <div style={{ marginBottom: "12px" }}>
              <SaveButton propertyId={property.id} initiallySaved={alreadySaved} />
            </div>
            {["SOLD", "RENTED"].includes(property.availabilityStatus) ? (
              <p style={{ color: COLORS.textGray, margin: 0 }}>
                This property is marked {AVAILABILITY_LABELS[property.availabilityStatus].toLowerCase()} and
                is no longer accepting enquiries.
              </p>
            ) : (
              <>
                <h2 style={{ color: COLORS.darkGreen, fontSize: "18px", marginTop: 0, marginBottom: "14px" }}>
                  Contact the seller
                </h2>
                <EnquireForm propertyId={property.id} />
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
