import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EnquireForm from "@/components/EnquireForm";
import ViewingRequestForm from "@/components/ViewingRequestForm";
import SaveButton from "@/components/SaveButton";
import AvailabilityForm from "@/components/AvailabilityForm";
import LocationView from "@/components/LocationView";
import VerificationPanel from "@/components/VerificationPanel";
import Nav from "@/components/Nav";
import { getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
import { toWhatsAppNumber } from "@/lib/phoneValidation";
import { getAdminMailtoHref, getAdminCallHref, getAdminWhatsAppHref } from "@/lib/adminContact";
import {
  AVAILABILITY_LABELS,
  getAvailabilityBadgeClass,
  isClosedAvailability,
} from "@/lib/availabilityStatus";

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={`dk-badge inline-block rounded-full ${className || "bg-[var(--dk-border)] text-[var(--dk-muted)]"}`}>
      {label}
    </span>
  );
}

function VerifiedSeal() {
  return (
    <span className="dk-seal">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 12.5l2 2 4-4.5M12 3l2.2 1.3 2.5-.2 1 2.3 2.1 1.4-.6 2.5.6 2.5-2.1 1.4-1 2.3-2.5-.2L12 18l-2.2-1.3-2.5.2-1-2.3-2.1-1.4.6-2.5-.6-2.5 2.1-1.4 1-2.3 2.5.2L12 3z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      Daktop Verified
    </span>
  );
}

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { verification?: string };
}) {
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

  const isOwner = session?.user?.id === property.sellerId;
  const isAdmin = session?.user?.role === "ADMIN";
  const whatsappNumber =
    property.showContact && property.seller.phone ? toWhatsAppNumber(property.seller.phone) : null;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hi, I'm enquiring about "${property.title}" on DAKTOP360.`
      )}`
    : null;

  // Lets the seller/agent reach the admin team about this specific listing (verification
  // status, a correction, a dispute, etc) without needing to hunt for a support address.
  const adminEnquirySubject = `Enquiry about listing: ${property.title} (${property.id})`;
  const adminEnquiryMessage = `Hi, I have a question about my listing "${property.title}" (ID: ${property.id}) on DAKTOP360.`;
  const adminMailtoHref = getAdminMailtoHref(adminEnquirySubject, adminEnquiryMessage);
  const adminCallHref = getAdminCallHref();
  const adminWhatsAppHref = getAdminWhatsAppHref(adminEnquiryMessage);

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
    <div className="dk-page min-h-screen">
      <Nav session={session} />

      <div className="dk-container">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <p>
            <Link href="/" className="dk-auth-link inline-flex items-center gap-1 text-[14px]">
              &larr; Back to all listings
            </Link>
          </p>

          <section className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-card)] p-6 shadow-[0_1px_2px_var(--dk-shadow)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="dk-heading !max-w-none !text-[30px]">{property.title}</h1>
            </div>

            <div className="dk-badge-row">
              {property.featured && <span className="dk-badge dk-badge-featured">Featured</span>}
              {property.daktopVerified && <VerifiedSeal />}
            </div>

            <div className="dk-badge-row">
              <Badge
                label={property.verified ? "Verified" : "Not Verified"}
                className={
                  property.verified
                    ? "bg-[var(--dk-primary)] text-white"
                    : "bg-[var(--dk-border)] text-[var(--dk-muted)]"
                }
              />
              <span
                className={`dk-badge dk-badge-availability ${getAvailabilityBadgeClass(
                  property.availabilityStatus
                )}`}
              >
                {AVAILABILITY_LABELS[property.availabilityStatus] || property.availabilityStatus}
              </span>
              {property.status !== "APPROVED" && (
                <span className="dk-badge bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)]">
                  {property.status} — not yet public
                </span>
              )}
            </div>

            {(isOwner || isAdmin) && (
              <div className="my-4">
                <AvailabilityForm propertyId={property.id} currentStatus={property.availabilityStatus} />
              </div>
            )}

            {isOwner && (adminMailtoHref || adminCallHref || adminWhatsAppHref) && (
              <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-4 py-3 text-[13.5px] text-[var(--dk-muted)]">
                <p className="mb-1">Have a question about this listing? Enquire with the admin team:</p>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {adminMailtoHref && (
                    <a href={adminMailtoHref} className="dk-auth-link">
                      Enquire via Email
                    </a>
                  )}
                  {adminMailtoHref && (adminCallHref || adminWhatsAppHref) && <span className="dk-auth-divider">—</span>}
                  {adminCallHref && (
                    <a href={adminCallHref} className="dk-auth-link">
                      Call Admin
                    </a>
                  )}
                  {adminCallHref && adminWhatsAppHref && <span className="dk-auth-divider">—</span>}
                  {adminWhatsAppHref && (
                    <a href={adminWhatsAppHref} target="_blank" rel="noopener noreferrer" className="dk-auth-link">
                      Enquire via WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            {property.adminNote && (isOwner || isAdmin) && (
              <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--dk-gold)] bg-[var(--dk-gold-bg)] px-4 py-3 text-[14px] leading-relaxed text-[var(--dk-gold-deep)]">
                <span className="font-semibold">Admin note:</span> {property.adminNote}
              </p>
            )}

            <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-[13.5px]">
              {isOwner && ["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(property.status) && (
                <Link href={`/properties/${property.id}/edit`} className="dk-auth-link">
                  Edit this listing
                </Link>
              )}
              {(isOwner || isAdmin) && (
                <Link href={`/properties/${property.id}/documents`} className="dk-auth-link">
                  {isOwner ? "Manage supporting documents" : "View supporting documents"}
                </Link>
              )}
            </div>

            {property.imageUrl && (
              <div className="mb-6">
                <div className="relative inline-block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)]">
                  <img
                    src={property.imageUrl}
                    alt={property.title}
                    width={480}
                    className="block h-auto max-w-full"
                  />
                  {isClosedAvailability(property.availabilityStatus) && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60">
                      <span className="rounded-md bg-white/95 px-4 py-1.5 text-base font-semibold uppercase tracking-wide text-gray-900 dark:bg-neutral-900/95 dark:text-neutral-50">
                        {AVAILABILITY_LABELS[property.availabilityStatus] || property.availabilityStatus}
                      </span>
                    </span>
                  )}
                </div>
                {property.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {property.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt={property.title}
                        width={160}
                        className="h-[100px] w-[100px] rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {property.videoUrl && (
              <div className="mb-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--dk-border)]">
                <video src={property.videoUrl} controls width={480} className="block max-w-full" />
              </div>
            )}

            <p className="dk-meta-row !overflow-visible !whitespace-normal">
              {getPropertyTypeLabel(property.propertyType, property.propertyTypeOther)} —{" "}
              {property.listingType === "SALE" ? "For sale" : "For rent"}
            </p>

            <span className="dk-price-eyebrow">Asking price</span>
            <div className="dk-price">KSh {property.price.toLocaleString()}</div>

            <div className="mb-4 flex flex-col gap-1 text-[14px] text-[var(--dk-ink)]">
              <p>Location: {property.location}</p>
              {property.bedrooms !== null && <p>Bedrooms: {property.bedrooms}</p>}
              {property.bathrooms !== null && <p>Bathrooms: {property.bathrooms}</p>}
              {property.acreage !== null && <p>Acreage: {property.acreage}</p>}
            </div>

            {property.latitude !== null && property.longitude !== null && (
              <div className="mb-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--dk-border)]">
                <LocationView
                  latitude={property.latitude}
                  longitude={property.longitude}
                  address={property.address}
                />
              </div>
            )}

            <p className="mb-4 text-[15px] leading-relaxed text-[var(--dk-ink)]">{property.description}</p>

            <p className="mb-4 text-[13px] text-[var(--dk-muted)]">
              {property.views} views — saved by {property._count.savedBy} buyer
              {property._count.savedBy === 1 ? "" : "s"}
            </p>

            <p className="mb-1 text-[14px] text-[var(--dk-ink)]">
              Listed by <strong>{property.seller.name || property.seller.email}</strong>{" "}
              ({getRoleLabel(property.seller.role)})
            </p>

            {property.showContact && property.seller.phone ? (
              <p className="dk-contact-info">
                Contact: {property.seller.phone}
                {whatsappHref && (
                  <>
                    {" — "}
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="dk-auth-link">
                      Enquire via WhatsApp
                    </a>
                  </>
                )}
              </p>
            ) : (
              (isOwner || isAdmin) && (
                <p className="text-[13px] text-[var(--dk-muted)]">
                  Contact is not currently shown to the public for this listing.
                </p>
              )
            )}

            {property.representingName && (
              <p className="dk-seller-info mt-1">
                Representing: {property.representingName}
                {property.representingContact && <> — {property.representingContact}</>}
              </p>
            )}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-card)] p-6 shadow-[0_1px_2px_var(--dk-shadow)] sm:p-8">
            <VerificationPanel
              daktopVerified={property.daktopVerified}
              locationVerified={property.locationVerified}
              ownershipVerified={property.ownershipVerified}
              surveyVerified={property.surveyVerified}
              daktopDecision={property.daktopDecision}
              documents={property.documents}
              seller={{
                name: property.seller.name,
                email: property.seller.email,
                role: property.seller.role ?? "OWNER",
                verified: property.seller.verified,
                identityVerificationStatus: property.seller.identityVerificationStatus,
                createdAt: property.seller.createdAt,
              }}
              sellerListingCount={sellerListingCount}
              defaultOpen={searchParams?.verification === "1"}
            />
          </section>

          {!session?.user && (
            <section className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-6 text-center text-[14.5px] text-[var(--dk-muted)]">
              <p>
                <Link href="/login" className="dk-auth-link">
                  Log in
                </Link>{" "}
                as a buyer to save this property or contact the seller.
              </p>
            </section>
          )}

          {session?.user?.role === "BUYER" && property.status === "APPROVED" && (
            <section className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-card)] p-6 shadow-[0_1px_2px_var(--dk-shadow)] sm:p-8">
              <div className="mb-4">
                <SaveButton propertyId={property.id} initiallySaved={alreadySaved} />
              </div>
              {isClosedAvailability(property.availabilityStatus) ? (
                <p className="text-[14.5px] text-[var(--dk-muted)]">
                  This property is marked {AVAILABILITY_LABELS[property.availabilityStatus].toLowerCase()} and
                  is no longer accepting enquiries.
                </p>
              ) : (
                <>
                  <h2 className="dk-search-title mb-3">Contact the seller</h2>
                  <EnquireForm propertyId={property.id} />

                  <h2 className="dk-search-title mb-3 mt-8">Request a viewing</h2>
                  <ViewingRequestForm propertyId={property.id} />
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
