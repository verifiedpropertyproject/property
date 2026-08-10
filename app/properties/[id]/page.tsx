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
    <div>
      <p>
        <Link href="/">&larr; Back to all listings</Link>
      </p>

      <h1>{property.title}</h1>
      {property.featured && <p>Featured listing</p>}
      <p>Tag: {property.verified ? "Verified" : "Not Verified"}</p>
      <p>Availability: {AVAILABILITY_LABELS[property.availabilityStatus] || property.availabilityStatus}</p>
      {(isOwner || isAdmin) && (
        <AvailabilityForm propertyId={property.id} currentStatus={property.availabilityStatus} />
      )}
      {property.status !== "APPROVED" && <p>Status: {property.status} (not yet public)</p>}
      {property.adminNote && (isOwner || isAdmin) && <p>Admin note: {property.adminNote}</p>}
      {isOwner && ["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(property.status) && (
        <p>
          <Link href={`/properties/${property.id}/edit`}>Edit this listing</Link>
        </p>
      )}
      {(isOwner || isAdmin) && (
        <p>
          <Link href={`/properties/${property.id}/documents`}>
            {isOwner ? "Manage supporting documents" : "View supporting documents"}
          </Link>
        </p>
      )}

      {property.imageUrl && (
        <p>
          <img src={property.imageUrl} alt={property.title} width={480} />
        </p>
      )}

      <p>
        {getPropertyTypeLabel(property.propertyType, property.propertyTypeOther)} —{" "}
        {property.listingType === "SALE" ? "For sale" : "For rent"}
      </p>
      <p>
        <strong>KSh {property.price.toLocaleString()}</strong>
      </p>
      <p>Location: {property.location}</p>
      {property.bedrooms !== null && <p>Bedrooms: {property.bedrooms}</p>}
      {property.bathrooms !== null && <p>Bathrooms: {property.bathrooms}</p>}
      {property.acreage !== null && <p>Acreage: {property.acreage}</p>}
      <p>{property.description}</p>
      <p>{property.views} views — saved by {property._count.savedBy} buyer{property._count.savedBy === 1 ? "" : "s"}</p>
      <p>
        Listed by {property.seller.name || property.seller.email} (
        {property.seller.role === "AGENT" ? "Agent" : "Property Owner"})
        {property.seller.verified && <> — Verified {property.seller.role === "AGENT" ? "Agent" : "Owner"}</>}
      </p>
      {property.showContact && property.seller.phone ? (
        <p>Contact: {property.seller.phone}</p>
      ) : (
        (isOwner || isAdmin) && <p>Contact is not currently shown to the public for this listing.</p>
      )}
      {property.representingName && (
        <p>
          Representing: {property.representingName}
          {property.representingContact && <> — {property.representingContact}</>}
        </p>
      )}

      <hr />

      {!session?.user && (
        <p>
          <Link href="/login">Log in</Link> as a buyer to save this property or contact the seller.
        </p>
      )}

      {session?.user?.role === "BUYER" && property.status === "APPROVED" && (
        <>
          <SaveButton propertyId={property.id} initiallySaved={alreadySaved} />
          {["SOLD", "RENTED"].includes(property.availabilityStatus) ? (
            <p>
              This property is marked {AVAILABILITY_LABELS[property.availabilityStatus].toLowerCase()} and
              is no longer accepting enquiries.
            </p>
          ) : (
            <>
              <h2>Contact the seller</h2>
              <EnquireForm propertyId={property.id} />
            </>
          )}
        </>
      )}
    </div>
  );
}
