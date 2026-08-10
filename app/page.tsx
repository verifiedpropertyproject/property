import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel } from "@/lib/propertyConstants";

type PropertyWithSeller = Property & { seller: Pick<User, "name" | "email" | "role" | "phone" | "verified"> };

type SearchParams = {
  location?: string;
  propertyType?: string;
  listingType?: string;
  availabilityStatus?: string;
  minPrice?: string;
  maxPrice?: string;
};

const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
};

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);

  const where: Prisma.PropertyWhereInput = { status: "APPROVED", seller: { suspended: false } };

  if (searchParams.location) {
    where.location = { contains: searchParams.location };
  }
  if (searchParams.propertyType) {
    where.propertyType = searchParams.propertyType;
  }
  if (searchParams.listingType) {
    where.listingType = searchParams.listingType;
  }
  if (searchParams.availabilityStatus) {
    where.availabilityStatus = searchParams.availabilityStatus;
  }
  if (searchParams.minPrice || searchParams.maxPrice) {
    where.price = {};
    if (searchParams.minPrice) where.price.gte = Number(searchParams.minPrice);
    if (searchParams.maxPrice) where.price.lte = Number(searchParams.maxPrice);
  }

  const properties = await prisma.property.findMany({
    where,
    include: { seller: { select: { name: true, email: true, role: true, phone: true, verified: true } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  // So each listing's Save button can show the correct initial state without a client-side fetch
  let savedPropertyIds = new Set<string>();
  if (session?.user?.role === "BUYER") {
    const saved = await prisma.savedProperty.findMany({
      where: { buyerId: session.user.id },
      select: { propertyId: true },
    });
    savedPropertyIds = new Set(saved.map((s: { propertyId: string }) => s.propertyId));
  }

  return (
    <div>
      <h1>Property Marketplace</h1>
      <p>Browse verified property listings.</p>

      {session?.user ? (
        <p>
          <Link href="/dashboard">Go to your dashboard</Link>
        </p>
      ) : (
        <p>
          <Link href="/login">Log in</Link> | <Link href="/register">Create an account</Link>
        </p>
      )}

      <hr />

      <h2>Search</h2>
      <form method="get">
        <div>
          <label>
            Location
            <br />
            <input type="text" name="location" defaultValue={searchParams.location} placeholder="e.g. Kitengela" />
          </label>
        </div>
        <div>
          <label>
            Property type
            <br />
            <select name="propertyType" defaultValue={searchParams.propertyType || ""}>
              <option value="">Any</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Listing type
            <br />
            <select name="listingType" defaultValue={searchParams.listingType || ""}>
              <option value="">Any</option>
              <option value="SALE">For sale</option>
              <option value="RENT">For rent</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Availability
            <br />
            <select name="availabilityStatus" defaultValue={searchParams.availabilityStatus || ""}>
              <option value="">Any</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="RENTED">Rented</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Min price (KSh)
            <br />
            <input type="number" name="minPrice" defaultValue={searchParams.minPrice} min="0" />
          </label>
        </div>
        <div>
          <label>
            Max price (KSh)
            <br />
            <input type="number" name="maxPrice" defaultValue={searchParams.maxPrice} min="0" />
          </label>
        </div>
        <button type="submit">Search</button>{" "}
        <a href="/">Clear filters</a>
      </form>

      <hr />

      <h2>Listings ({properties.length})</h2>
      {properties.length === 0 ? (
        <p>No properties match your search.</p>
      ) : (
        <ul>
          {properties.map((p: PropertyWithSeller) => (
            <li key={p.id}>
              {p.imageUrl && (
                <p>
                  <Link href={`/properties/${p.id}`}>
                    <img src={p.imageUrl} alt={p.title} width={200} />
                  </Link>
                </p>
              )}
              {p.featured && <>[FEATURED] </>}
              [{AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}]{" "}
              <Link href={`/properties/${p.id}`}>
                <strong>{p.title}</strong>
              </Link>{" "}
              — {p.verified ? "Verified" : "Not Verified"} — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} —{" "}
              {p.listingType === "SALE" ? "For sale" : "For rent"} — KSh {p.price.toLocaleString()}
              <br />
              {p.location}
              {p.bedrooms !== null && <> — {p.bedrooms} bed</>}
              {p.bathrooms !== null && <> — {p.bathrooms} bath</>}
              {p.acreage !== null && <> — {p.acreage} acres</>}
              <br />
              <small>
                Listed by {p.seller.name || p.seller.email} ({p.seller.role === "AGENT" ? "Agent" : "Owner"})
                {p.seller.verified && <> — Verified {p.seller.role === "AGENT" ? "Agent" : "Owner"}</>}
                {p.representingName && <> — representing {p.representingName}</>}
              </small>
              {p.showContact && p.seller.phone && (
                <>
                  <br />
                  <small>Contact: {p.seller.phone}</small>
                </>
              )}
              {session?.user?.role === "BUYER" && (
                <>
                  <br />
                  <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
