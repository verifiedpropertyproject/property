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
      <div>
        <div>
          <h1>Supporting Documents</h1>
          <p>
            You don&apos;t have access to this listing&apos;s documents.
          </p>
          <p>
            <Link
              href="/dashboard"
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
    <div>
      <div>
        <p>
          <Link href={`/properties/${property.id}`}>
            &larr; Back to listing
          </Link>
        </p>

        <h1>
          Supporting Documents
        </h1>
        <p>
          For: <strong>{property.title}</strong>
        </p>

        <section>
          <h2>Where this listing stands</h2>
          <p>
            This is the last step of creating your listing. Your property details are already
            saved — adding documents below is optional but helps us verify it faster.
          </p>
          <p>
            Current status: <strong>{STATUS_LABELS[property.status] || property.status}</strong>
          </p>
          {property.status === "PENDING" && (
            <p>
              You don&apos;t need to click anything else after this page. Once you&apos;re done
              adding documents (or if you have none to add right now), your listing stays in the
              review queue and Daktop will check it.
            </p>
          )}
          {property.status === "CHANGES_REQUESTED" && property.adminNote && (
            <p>
              Daktop asked for a change before this can be reviewed further: &quot;{property.adminNote}&quot;
            </p>
          )}
        </section>

        {isAdmin && (
          <section>
            <h2>Verification status</h2>
            <p>
              Shown to everyone on the public listing page. Update as document/location/ownership
              checks are completed.
            </p>
            <p>
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

        <section>
          <h2>
            {documents.length === 0
              ? "Documents you've submitted"
              : `Documents you've submitted (${documents.length})`}
          </h2>
          {documents.length === 0 ? (
            <p>
              You haven&apos;t uploaded any documents yet. Add at least one below — a title deed
              or similar proof of ownership helps your listing get reviewed faster.
            </p>
          ) : (
            <ol>
              {documents.map((doc: PropertyDocument, index: number) => (
                <li key={doc.id}>
                  <p>
                    Document {index + 1}:{" "}
                    {doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Unspecified type"}
                  </p>
                  <p>
                    File: <a href={`/api/documents/${doc.id}`}>{doc.fileName}</a>{" "}
                    ({(doc.fileSize / 1024).toFixed(0)} KB)
                  </p>
                  <p>
                    Submitted by you on {new Date(doc.createdAt).toLocaleString()}
                  </p>
                  <p>
                    Daktop review: {doc.verified ? "Received \u2713" : "Pending review"}
                  </p>
                  {isAdmin && (
                    <p>
                      <DocumentVerifyButton documentId={doc.id} verified={doc.verified} />
                    </p>
                  )}
                  {isOwner && (
                    <p>
                      <DeleteDocumentButton documentId={doc.id} fileName={doc.fileName} />
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        {isOwner && (
          <section>
            <h2>Add another document</h2>
            <p>
              You can upload as many documents as you have — one at a time or several at once —
              and you can keep coming back to add more later, even after your first upload.
            </p>
            <DocumentUploadForm propertyId={property.id} />
            <p>
              Done for now?{" "}
              <Link href="/dashboard">Return to your dashboard</Link> — your listing stays in the
              review queue whether or not you add more documents.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}