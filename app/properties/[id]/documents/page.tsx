import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PropertyDocument } from "@prisma/client";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documentStorage";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";
import DocumentVerifyButton from "@/components/DocumentVerifyButton";
import VerificationStatusForm from "@/components/VerificationStatusForm";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved — live on the site",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Rejected",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)] ring-1 ring-[var(--dk-gold)]",
  APPROVED: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)] ring-1 ring-[var(--dk-primary)]",
  CHANGES_REQUESTED: "bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)] ring-1 ring-[var(--dk-gold)]",
  REJECTED: "bg-[var(--dk-danger-bg)] text-[var(--dk-danger-ink)] ring-1 ring-[var(--dk-danger-ink)]",
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
      <div className="min-h-screen bg-[var(--dk-ivory)] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[var(--dk-card)] rounded-2xl shadow-[0_20px_40px_var(--dk-shadow-strong)] ring-1 ring-[var(--dk-border)] p-10 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dk-ivory)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-[var(--dk-heading)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="[font-family:var(--font-display)] text-2xl text-[var(--dk-heading)] mb-2">Supporting Documents</h1>
          <p className="text-[var(--dk-muted)] mb-8">
            You don&apos;t have access to this listing&apos;s documents.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-[var(--dk-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--dk-primary-hover)]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const documents = await prisma.propertyDocument.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[var(--dk-ivory)]">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:px-0">
        <p className="mb-6">
          <Link
            href={`/properties/${property.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--dk-muted)] transition-colors hover:text-[var(--dk-heading)]"
          >
            <span aria-hidden="true">&larr;</span> Back to listing
          </Link>
        </p>

        <div className="mb-10">
          <h1 className="[font-family:var(--font-display)] text-3xl sm:text-4xl text-[var(--dk-heading)] tracking-tight">
            Supporting Documents
          </h1>
          <p className="mt-2 text-[var(--dk-muted)]">
            For: <strong className="font-semibold text-[var(--dk-heading)]">{property.title}</strong>
          </p>
        </div>

        <section className="mb-8 rounded-2xl bg-[var(--dk-card)] p-8 shadow-sm ring-1 ring-[var(--dk-border)]">
          <h2 className="[font-family:var(--font-display)] text-xl text-[var(--dk-heading)] mb-4">Where this listing stands</h2>
          <p className="text-[var(--dk-ink)] leading-relaxed">
            This is the last step of creating your listing. Your property details are already
            saved — adding documents below is optional but helps us verify it faster.
          </p>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-[var(--dk-ink)]">
            Current status:
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                STATUS_BADGE_STYLES[property.status] ?? "bg-[var(--dk-ivory)] text-[var(--dk-heading)] ring-1 ring-[var(--dk-border)]"
              }`}
            >
              {STATUS_LABELS[property.status] || property.status}
            </span>
          </p>
          {property.status === "PENDING" && (
            <p className="mt-4 rounded-xl bg-[var(--dk-ivory)] p-4 text-sm text-[var(--dk-ink)] leading-relaxed ring-1 ring-[var(--dk-border)]">
              You don&apos;t need to click anything else after this page. Once you&apos;re done
              adding documents (or if you have none to add right now), your listing stays in the
              review queue and Daktop will check it.
            </p>
          )}
          {property.status === "CHANGES_REQUESTED" && property.adminNote && (
            <p className="mt-4 rounded-xl bg-[var(--dk-gold-bg)] p-4 text-sm text-[var(--dk-gold-deep)] leading-relaxed ring-1 ring-[var(--dk-gold)]">
              Daktop asked for a change before this can be reviewed further: &quot;{property.adminNote}&quot;
            </p>
          )}
        </section>

        {isAdmin && (
          <section className="mb-8 rounded-2xl bg-[var(--dk-card)] p-8 shadow-sm ring-1 ring-[var(--dk-border)]">
            <h2 className="[font-family:var(--font-display)] text-xl text-[var(--dk-heading)] mb-2">Verification status</h2>
            <p className="text-[var(--dk-muted)] mb-4">
              Shown to everyone on the public listing page. Update as document/location/ownership
              checks are completed.
            </p>
            <p
              className={`mb-6 rounded-xl p-4 text-sm font-medium leading-relaxed ${
                property.daktopVerified
                  ? "bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)] ring-1 ring-[var(--dk-gold)]"
                  : "bg-[var(--dk-ivory)] text-[var(--dk-ink)] ring-1 ring-[var(--dk-border)]"
              }`}
            >
              {property.daktopVerified
                ? "DAKTOP VERIFIED — every check below is complete. This badge is shown on the listing automatically and clears itself if anything changes."
                : "Not yet DAKTOP VERIFIED — every document must be marked received, all three checks below ticked, and the decision set to Safe to buy."}
            </p>
            <VerificationStatusForm
              propertyId={property.id}
              currentLocationVerified={property.locationVerified}
              currentOwnershipVerified={property.ownershipVerified}
              currentSurveyVerified={property.surveyVerified}
              currentDaktopDecision={property.daktopDecision}
            />
          </section>
        )}

        <section className="mb-8 rounded-2xl bg-[var(--dk-card)] p-8 shadow-sm ring-1 ring-[var(--dk-border)]">
          <h2 className="[font-family:var(--font-display)] text-xl text-[var(--dk-heading)] mb-5">
            {documents.length === 0
              ? "Documents you've submitted"
              : `Documents you've submitted (${documents.length})`}
          </h2>
          {documents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--dk-border)] p-6 text-center text-[var(--dk-muted)] leading-relaxed">
              You haven&apos;t uploaded any documents yet. Add at least one below — a title deed
              or similar proof of ownership helps your listing get reviewed faster.
            </p>
          ) : (
            <ol className="space-y-4">
              {documents.map((doc: PropertyDocument, index: number) => (
                <li
                  key={doc.id}
                  className="rounded-xl border border-[var(--dk-border)] p-5 transition-shadow hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-gold)]">
                    Document {index + 1}:{" "}
                    {doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Unspecified type"}
                  </p>
                  <p className="mt-2 text-[var(--dk-heading)]">
                    File:{" "}
                    <a
                      href={`/api/documents/${doc.id}`}
                      className="font-medium text-[var(--dk-heading)] underline decoration-[var(--dk-gold)] decoration-2 underline-offset-2 hover:text-[var(--dk-primary-hover)]"
                    >
                      {doc.fileName}
                    </a>{" "}
                    <span className="text-[var(--dk-muted)]">({(doc.fileSize / 1024).toFixed(0)} KB)</span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--dk-muted)]">
                    Submitted by you on {new Date(doc.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-[var(--dk-ink)]">
                    Daktop review:{" "}
                    <span className={doc.verified ? "font-medium text-[var(--dk-primary)]" : "font-medium text-[var(--dk-gold-deep)]"}>
                      {doc.verified ? "Received \u2713" : "Pending review"}
                    </span>
                  </p>
                  {(isAdmin || isOwner) && (
                    <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--dk-border)] pt-4">
                      {isAdmin && <DocumentVerifyButton documentId={doc.id} verified={doc.verified} />}
                      {isOwner && <DeleteDocumentButton documentId={doc.id} fileName={doc.fileName} />}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        {isOwner && (
          <section className="rounded-2xl bg-[var(--dk-card)] p-8 shadow-sm ring-1 ring-[var(--dk-border)]">
            <h2 className="[font-family:var(--font-display)] text-xl text-[var(--dk-heading)] mb-2">Add another document</h2>
            <p className="text-[var(--dk-muted)] mb-6 leading-relaxed">
              You can upload as many documents as you have — one at a time or several at once —
              and you can keep coming back to add more later, even after your first upload.
            </p>
            <DocumentUploadForm propertyId={property.id} />
            <p className="mt-8 border-t border-[var(--dk-border)] pt-6 text-[var(--dk-ink)]">
              Done for now?{" "}
              <Link
                href="/dashboard"
                className="font-medium text-[var(--dk-heading)] underline decoration-[var(--dk-gold)] decoration-2 underline-offset-2 hover:text-[var(--dk-primary-hover)]"
              >
                Return to your dashboard
              </Link>{" "}
              — your listing stays in the review queue whether or not you add more documents.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
