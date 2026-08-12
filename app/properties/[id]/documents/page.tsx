import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PropertyDocument } from "@prisma/client";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documentStorage";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";

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

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  padding: "clamp(16px, 3vw, 24px)",
  marginBottom: "24px",
};

const sectionHeadingStyle: React.CSSProperties = {
  color: COLORS.darkGreen,
  marginTop: 0,
  marginBottom: "16px",
  fontSize: "18px",
};

const listItemCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.sectionBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",
  padding: "14px 16px",
  marginBottom: "12px",
};

export default async function PropertyDocumentsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) {
    notFound();
  }

  const isOwner = property.sellerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
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
          <h1 style={{ color: COLORS.darkGreen, fontSize: "20px", marginBottom: "10px" }}>Supporting Documents</h1>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>
            You don&apos;t have access to this listing&apos;s documents.
          </p>
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

  const documents = await prisma.propertyDocument.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "desc" },
  });

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

          .dk-doc-link {
            color: ${COLORS.primaryGreen};
            font-weight: 600;
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .dk-doc-link:hover {
            color: ${COLORS.primaryGreenHover};
            text-decoration: underline;
          }
          .dk-doc-file-link {
            color: ${COLORS.textDark};
            font-weight: 600;
            text-decoration: none;
            border-bottom: 1px solid ${COLORS.border};
            transition: color 0.2s ease, border-color 0.2s ease;
          }
          .dk-doc-file-link:hover {
            color: ${COLORS.primaryGreen};
            border-color: ${COLORS.primaryGreen};
          }
        `}</style>

        <p style={{ marginBottom: "20px" }}>
          <Link href={`/properties/${property.id}`} className="dk-doc-link">
            &larr; Back to listing
          </Link>
        </p>

        <h1 style={{ color: COLORS.darkGreen, fontSize: "clamp(22px, 3vw, 28px)", marginBottom: "6px" }}>
          Supporting Documents
        </h1>
        <p style={{ color: COLORS.textGray, margin: "0 0 4px 0", fontSize: "14px" }}>
          For: <strong style={{ color: COLORS.textDark }}>{property.title}</strong>
        </p>
        <p style={{ color: COLORS.textGray, marginTop: 0, marginBottom: "24px", fontSize: "14px", lineHeight: 1.6 }}>
          Upload documents that help us verify this property and your authority to list it.
        </p>

        <section style={sectionCardStyle}>
          <h2 style={sectionHeadingStyle}>Documents</h2>
          {documents.length === 0 ? (
            <p style={{ color: COLORS.textGray, margin: 0 }}>No documents uploaded yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {documents.map((doc: PropertyDocument) => (
                <li key={doc.id} style={listItemCardStyle}>
                  <div style={{ color: COLORS.textGray, fontSize: "12px", fontWeight: 600, marginBottom: "6px", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                    {doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Unspecified type"}
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <a href={`/api/documents/${doc.id}`} className="dk-doc-file-link">
                      {doc.fileName}
                    </a>{" "}
                    <span style={{ color: COLORS.textGray, fontSize: "13px" }}>
                      ({(doc.fileSize / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <small style={{ color: COLORS.textGray }}>
                    Uploaded {new Date(doc.createdAt).toLocaleString()}
                  </small>
                  {isOwner && (
                    <div style={{ marginTop: "10px" }}>
                      <DeleteDocumentButton documentId={doc.id} fileName={doc.fileName} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {isOwner && (
          <section style={sectionCardStyle}>
            <h2 style={sectionHeadingStyle}>+ Upload Document</h2>
            <DocumentUploadForm propertyId={property.id} />
          </section>
        )}
      </div>
    </div>
  );
}
