import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PropertyEditForm from "@/components/PropertyEditForm";

const EDITABLE_STATUSES = ["PENDING", "CHANGES_REQUESTED", "REJECTED"];

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
  dangerBg: "#FDECEC",
  dangerText: "#B42318",
  warnBg: "#FEF6E7",
  warnText: "#92600B",
};

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  padding: "clamp(16px, 3vw, 24px)",
};

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const property = await prisma.property.findUnique({ where: { id: params.id } });

  if (!property) {
    notFound();
  }

  if (property.sellerId !== session.user.id) {
    return (
      <div
        style={{
          backgroundColor: COLORS.pageBg,
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: COLORS.darkGreen, fontSize: "20px", marginBottom: "10px" }}>Edit listing</h1>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>You can only edit your own listings.</p>
          <p style={{ marginTop: "16px" }}>
            <Link
              href="/dashboard"
              style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}
            >
              Back to dashboard
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (!EDITABLE_STATUSES.includes(property.status)) {
    return (
      <div
        style={{
          backgroundColor: COLORS.pageBg,
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: COLORS.darkGreen, fontSize: "20px", marginBottom: "10px" }}>Edit listing</h1>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>
            This listing has already been approved and can no longer be edited here.
          </p>
          <p style={{ marginTop: "16px" }}>
            <Link
              href={`/properties/${property.id}`}
              style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}
            >
              View listing
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.pageBg, minHeight: "100vh" }}>
      <div
        style={{
          color: COLORS.textDark,
          fontFamily: "system-ui, -apple-system, sans-serif",
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
        <style>{`
          * { box-sizing: border-box; }
        `}</style>

        <h1 style={{ color: COLORS.darkGreen, fontSize: "clamp(22px, 3vw, 28px)", marginBottom: "18px" }}>
          Edit listing
        </h1>

        {property.status === "CHANGES_REQUESTED" && property.adminNote && (
          <p
            style={{
              color: COLORS.warnText,
              backgroundColor: COLORS.warnBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "14px",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            The admin requested changes: {property.adminNote}
          </p>
        )}
        {property.status === "REJECTED" && (
          <p
            style={{
              color: COLORS.dangerText,
              backgroundColor: COLORS.dangerBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "14px",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            This listing was rejected{property.adminNote ? `: ${property.adminNote}` : "."} You can
            edit and resubmit it for another review.
          </p>
        )}

        <section style={sectionCardStyle}>
          <PropertyEditForm
            isAgent={session.user.role === "AGENT"}
            property={{
              id: property.id,
              title: property.title,
              description: property.description,
              location: property.location,
              propertyType: property.propertyType,
              propertyTypeOther: property.propertyTypeOther,
              listingType: property.listingType,
              price: property.price,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              acreage: property.acreage,
              imageUrl: property.imageUrl,
              representingName: property.representingName,
              representingContact: property.representingContact,
            }}
          />
        </section>
      </div>
    </div>
  );
}
