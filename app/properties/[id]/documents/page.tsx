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
        <h1>Supporting Documents</h1>
        <p>You don't have access to this listing's documents.</p>
        <p>
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    );
  }

  const documents = await prisma.propertyDocument.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <p>
        <Link href={`/properties/${property.id}`}>&larr; Back to listing</Link>
      </p>

      <h1>Supporting Documents</h1>
      <p>For: {property.title}</p>
      <p>
        Upload documents that help us verify this property and your authority to list it.
      </p>

      {documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <ul>
          {documents.map((doc: PropertyDocument) => (
            <li key={doc.id}>
              {doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Unspecified type"} —{" "}
              <a href={`/api/documents/${doc.id}`}>{doc.fileName}</a> ({(doc.fileSize / 1024).toFixed(0)} KB)
              <br />
              <small>Uploaded {new Date(doc.createdAt).toLocaleString()}</small>
              {isOwner && (
                <>
                  {" "}
                  <DeleteDocumentButton documentId={doc.id} fileName={doc.fileName} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <>
          <h2>+ Upload Document</h2>
          <DocumentUploadForm propertyId={property.id} />
        </>
      )}
    </div>
  );
}
