import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PropertyEditForm from "@/components/PropertyEditForm";

const EDITABLE_STATUSES = ["PENDING", "CHANGES_REQUESTED", "REJECTED"];

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
      <div>
        <div>
          <h1>Edit listing</h1>
          <p>You can only edit your own listings.</p>
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

  if (!EDITABLE_STATUSES.includes(property.status)) {
    return (
      <div>
        <div>
          <h1>Edit listing</h1>
          <p>
            This listing has already been approved and can no longer be edited here.
          </p>
          <p>
            <Link
              href={`/properties/${property.id}`}
            >
              View listing
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1>
          Edit listing
        </h1>

        {property.status === "CHANGES_REQUESTED" && property.adminNote && (
          <p>
            The admin requested changes: {property.adminNote}
          </p>
        )}
        {property.status === "REJECTED" && (
          <p>
            This listing was rejected{property.adminNote ? `: ${property.adminNote}` : "."} You can
            edit and resubmit it for another review.
          </p>
        )}

        <section>
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
            }}
          />
        </section>
      </div>
    </div>
  );
}