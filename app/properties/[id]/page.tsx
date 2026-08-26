import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EnquireForm from "@/components/EnquireForm";
import SaveButton from "@/components/SaveButton";
import AvailabilityForm from "@/components/AvailabilityForm";
import LocationView from "@/components/LocationView";
import { getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
import { getIdentityVerificationLabel } from "@/lib/identityVerification";
import { toWhatsAppNumber } from "@/lib/phoneValidation";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documentStorage";
import { getDaktopDecisionLabel } from "@/lib/verificationStatus";

const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
};

function Badge({ label }: { label: string }) {
  return <span>{label}</span>;
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      seller: {
        select: {
          name: true,
          email: true,
          phone: true,
          role: true,
          suspended: true,
          verified: true,
          createdAt: true,
          identityVerificationStatus: true,
        },
      },
      _count: { select: { savedBy: true } },
      images: { orderBy: { createdAt: "asc" } },
      // Only the type/status of each document is shown publicly here (trust signal) — the
      // actual file stays reachable only through the authenticated /documents page.
      documents: {
        select: { id: true, documentType: true, verified: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!property) {
    notFound();
  }

  // Track-record signals shown alongside the seller/agent's name — how long they've been on
  // the platform and how many other properties they currently have publicly listed. Distinct
  // from the phone/email contact info above, which stays admin-gated via showContact.
  const sellerListingCount = await prisma.property.count({
    where: { sellerId: property.sellerId, status: "APPROVED" },
  });
  const sellerMemberSinceLabel = property.seller.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isOwner = session?.user?.id === property.sellerId;
  const isAdmin = session?.user?.role === "ADMIN";
  const whatsappNumber =
    property.showContact && property.seller.phone ? toWhatsAppNumber(property.seller.phone) : null;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hi, I'm enquiring about "${property.title}" on DAKTOP360.`
      )}`
    : null;

  if (property.status !== "APPROVED" && !isOwner && !isAdmin) {
    notFound();
  }

  if (property.seller.suspended && !isAdmin) {
    notFound();
  }

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
    <div>
      <div>
        <p>
          <Link href="/">
            &larr; Back to all listings
          </Link>
        </p>

        <section>
          <div>
            <h1>
              {property.title}
            </h1>
            {property.featured && <Badge label="FEATURED" />}
            {property.daktopVerified && <Badge label="DAKTOP VERIFIED" />}
          </div>

          <div>
            <Badge
              label={property.verified ? "Verified" : "Not Verified"}
            />
            <Badge
              label={AVAILABILITY_LABELS[property.availabilityStatus] || property.availabilityStatus}
            />
            {property.status !== "APPROVED" && (
              <Badge label={`${property.status} — not yet public`} />
            )}
          </div>

          {(isOwner || isAdmin) && (
            <div>
              <AvailabilityForm propertyId={property.id} currentStatus={property.availabilityStatus} />
            </div>
          )}

          {property.adminNote && (isOwner || isAdmin) && (
            <p>
              Admin note: {property.adminNote}
            </p>
          )}

          <div>
            {isOwner && ["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(property.status) && (
              <Link href={`/properties/${property.id}/edit`}>
                Edit this listing
              </Link>
            )}
            {(isOwner || isAdmin) && (
              <Link href={`/properties/${property.id}/documents`}>
                {isOwner ? "Manage supporting documents" : "View supporting documents"}
              </Link>
            )}
          </div>

          {property.imageUrl && (
            <div>
              <img
                src={property.imageUrl}
                alt={property.title}
                width={480}
              />
              {property.images.length > 0 && (
                <div>
                  {property.images.map((img) => (
                    <img key={img.id} src={img.url} alt={property.title} width={160} />
                  ))}
                </div>
              )}
            </div>
          )}

          {property.videoUrl && (
            <div>
              <video src={property.videoUrl} controls width={480} />
            </div>
          )}

          <p>
            {getPropertyTypeLabel(property.propertyType, property.propertyTypeOther)} —{" "}
            {property.listingType === "SALE" ? "For sale" : "For rent"}
          </p>

          <p>
            KSh {property.price.toLocaleString()}
          </p>

          <div>
            <p>Location: {property.location}</p>
            {property.bedrooms !== null && <p>Bedrooms: {property.bedrooms}</p>}
            {property.bathrooms !== null && <p>Bathrooms: {property.bathrooms}</p>}
            {property.acreage !== null && <p>Acreage: {property.acreage}</p>}
          </div>

          {property.latitude !== null && property.longitude !== null && (
            <div>
              <LocationView
                latitude={property.latitude}
                longitude={property.longitude}
                address={property.address}
              />
            </div>
          )}

          <p>{property.description}</p>

          <p>
            {property.views} views — saved by {property._count.savedBy} buyer{property._count.savedBy === 1 ? "" : "s"}
          </p>

          <p>
            Listed by <strong>{property.seller.name || property.seller.email}</strong>{" "}
            ({getRoleLabel(property.seller.role)})
            {property.seller.verified && <> — Verified {getRoleLabel(property.seller.role)}</>}
          </p>

          <p>
            Member since {sellerMemberSinceLabel} — {sellerListingCount} active listing
            {sellerListingCount === 1 ? "" : "s"} on DAKTOP360
            {property.daktopVerified && <> — Daktop Verified listing</>}
          </p>

          {property.seller.identityVerificationStatus !== "NOT_SUBMITTED" && (
            <p>
              Seller identity check: {getIdentityVerificationLabel(property.seller.identityVerificationStatus)}
            </p>
          )}

          {property.showContact && property.seller.phone ? (
            <p>
              Contact: {property.seller.phone}
              {whatsappHref && (
                <>
                  {" — "}
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    Enquire via WhatsApp
                  </a>
                </>
              )}
            </p>
          ) : (
            (isOwner || isAdmin) && (
              <p>
                Contact is not currently shown to the public for this listing.
              </p>
            )
          )}

          {property.representingName && (
            <p>
              Representing: {property.representingName}
              {property.representingContact && <> — {property.representingContact}</>}
            </p>
          )}
        </section>

        <section>
          <h2>Daktop Verification</h2>

          {property.daktopVerified && (
            <p>
              <Badge label="DAKTOP VERIFIED" /> — every check below has been completed.
            </p>
          )}

          {property.documents.length > 0 ? (
            <ul>
              {property.documents.map((doc) => (
                <li key={doc.id}>
                  {(doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Document")} received:{" "}
                  {doc.verified ? "\u2713" : "Pending"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No supporting documents submitted yet.</p>
          )}

          <p>
            Location verification: {property.locationVerified ? "\u2713" : "Pending"}
          </p>
          <p>
            Ownership verification: {property.ownershipVerified ? "\u2713" : "Pending"}
          </p>
          <p>
            Survey verification: {property.surveyVerified ? "\u2713" : "Pending"}
          </p>
          <p>
            Daktop Decision: {getDaktopDecisionLabel(property.daktopDecision)}
          </p>
        </section>

        {!session?.user && (
          <section>
            <p>
              <Link href="/login">
                Log in
              </Link>{" "}
              as a buyer to save this property or contact the seller.
            </p>
          </section>
        )}

        {session?.user?.role === "BUYER" && property.status === "APPROVED" && (
          <section>
            <div>
              <SaveButton propertyId={property.id} initiallySaved={alreadySaved} />
            </div>
            {["SOLD", "RENTED"].includes(property.availabilityStatus) ? (
              <p>
                This property is marked {AVAILABILITY_LABELS[property.availabilityStatus].toLowerCase()} and
                is no longer accepting enquiries.
              </p>
            ) : (
              <>
                <h2>
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