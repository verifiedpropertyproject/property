import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PropertyDocument } from "@prisma/client";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documentStorage";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";

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
        <p>
          Upload documents that help us verify this property and your authority to list it.
        </p>

        <section>
          <h2>Documents</h2>
          {documents.length === 0 ? (
            <p>No documents uploaded yet.</p>
          ) : (
            <ul>
              {documents.map((doc: PropertyDocument) => (
                <li key={doc.id}>
                  <div>
                    {doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Unspecified type"}
                  </div>
                  <div>
                    <a href={`/api/documents/${doc.id}`}>
                      {doc.fileName}
                    </a>{" "}
                    <span>
                      ({(doc.fileSize / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <small>
                    Uploaded {new Date(doc.createdAt).toLocaleString()}
                  </small>
                  {isOwner && (
                    <div>
                      <DeleteDocumentButton documentId={doc.id} fileName={doc.fileName} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {isOwner && (
          <section>
            <h2>+ Upload Document</h2>
            <DocumentUploadForm propertyId={property.id} />
          </section>
        )}
      </div>
    </div>
  );
}