import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PropertyEditForm from "@/components/PropertyEditForm";
import PropertyGalleryManager from "@/components/PropertyGalleryManager";
import PropertyVideoManager from "@/components/PropertyVideoManager";
import Nav from "@/components/Nav";

const EDITABLE_STATUSES = ["PENDING", "CHANGES_REQUESTED", "REJECTED"];

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });

  if (!property) {
    notFound();
  }

  if (property.sellerId !== session.user.id) {
    return (
      <div className="dk-page min-h-screen">
        <Nav session={session} />
        <div className="dk-container">
          <div
            className="mx-auto flex max-w-md flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-8 text-center sm:items-center"
          >
            <h1 className="dk-heading !text-[26px]">Edit listing</h1>
            <p className="dk-lede">You can only edit your own listings.</p>
            <Link href="/dashboard" className="dk-auth-link">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!EDITABLE_STATUSES.includes(property.status)) {
    return (
      <div className="dk-page min-h-screen">
        <Nav session={session} />
        <div className="dk-container">
          <div
            className="mx-auto flex max-w-md flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-8 text-center sm:items-center"
          >
            <h1 className="dk-heading !text-[26px]">Edit listing</h1>
            <p className="dk-lede">
              This listing has already been approved and can no longer be edited here.
            </p>
            <Link href={`/properties/${property.id}`} className="dk-auth-link">
              View listing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dk-page min-h-screen">
      <Nav session={session} />

      <div className="dk-container">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <header>
            <span className="dk-kicker">Manage listing</span>
            <h1 className="dk-heading">Edit listing</h1>
          </header>

          {property.status === "CHANGES_REQUESTED" && property.adminNote && (
            <p className="rounded-[var(--radius-md)] border border-[var(--dk-gold)] bg-[var(--dk-gold-bg)] px-4 py-3 text-[14px] leading-relaxed text-[var(--dk-gold-deep)]">
              <span className="font-semibold">The admin requested changes:</span> {property.adminNote}
            </p>
          )}
          {property.status === "REJECTED" && (
            <p className="rounded-[var(--radius-md)] border border-[color:rgb(224_92_74_/_0.4)] bg-[var(--dk-danger-bg)] px-4 py-3 text-[14px] leading-relaxed text-[var(--dk-danger-ink)]">
              This listing was rejected{property.adminNote ? `: ${property.adminNote}` : "."} You can
              edit and resubmit it for another review.
            </p>
          )}

          <section className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-6 shadow-[0_1px_2px_var(--dk-shadow)] sm:p-8">
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
                latitude: property.latitude,
                longitude: property.longitude,
                address: property.address,
                placeId: property.placeId,
                commissionRate: property.commissionRate,
                commissionAgreedAt: property.commissionAgreedAt,
                commissionAgreementText: property.commissionAgreementText,
              }}
            />
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-6 shadow-[0_1px_2px_var(--dk-shadow)] sm:p-8">
            <h2 className="dk-search-title mb-4">Additional photos</h2>
            <PropertyGalleryManager
              propertyId={property.id}
              images={property.images.map((img) => ({ id: img.id, url: img.url }))}
            />
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-6 shadow-[0_1px_2px_var(--dk-shadow)] sm:p-8">
            <h2 className="dk-search-title mb-4">Walkthrough video</h2>
            <PropertyVideoManager propertyId={property.id} videoUrl={property.videoUrl} />
          </section>
        </div>
      </div>
    </div>
  );
}