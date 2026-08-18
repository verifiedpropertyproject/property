import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";

import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel } from "@/lib/propertyConstants";
import BuySellCard from "@/components/BuySellCard";


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

      <div>
        <header>
          <h1>
            East Africa&apos;s Trusted Marketplace for Verified Properties
          </h1>
          <p>
            Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
          </p>

          {session?.user ? (
            <p>
              <Link href="/dashboard">
                Go to your dashboard
              </Link>
            </p>
          ) : (
            <p>
              <Link href="/login">
                Log in
              </Link>
              {" "}
              |
              {" "}
              <Link href="/register">
                Create an account
              </Link>
            </p>
          )}
        </header>

        <section>
          <h2>
            Find a Property
          </h2>

          <form method="get">
            <div>
              <div>
                <label>Location / County</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={searchParams.location}
                  placeholder="e.g. Kitengela"
                />
              </div>

              <div>
                <label>Property Type</label>
                <select
                  name="propertyType"
                  defaultValue={searchParams.propertyType || ""}
                >
                  <option value="">Any type</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PROPERTY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Buy or Rent</label>
                <select
                  name="listingType"
                  defaultValue={searchParams.listingType || ""}
                >
                  <option value="">Any</option>
                  <option value="SALE">For sale</option>
                  <option value="RENT">For rent</option>
                </select>
              </div>

              <div>
                <label>Availability</label>
                <select
                  name="availabilityStatus"
                  defaultValue={searchParams.availabilityStatus || ""}
                >
                  <option value="">Any</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                  <option value="RENTED">Rented</option>
                </select>
              </div>

              <div>
                <label>Min Price (KSh)</label>
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={searchParams.minPrice}
                  min="0"
                  placeholder="Any"
                />
              </div>

              <div>
                <label>Max Price (KSh)</label>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={searchParams.maxPrice}
                  min="0"
                  placeholder="Any"
                />
              </div>
            </div>

            <div>
              <button type="submit">
                Search Properties
              </button>
              <a href="/">
                Clear filters
              </a>
            </div>
          </form>
        </section>
      </div>

      <hr />

      <section>
        <h2>
          Verified Listings ({properties.length})
        </h2>

        {properties.length === 0 ? (
          <p>No properties match your search. Try adjusting your filters.</p>
        ) : (
          <ul>
            {properties.map((p: PropertyWithSeller) => (
              <li key={p.id}>
                {p.imageUrl && (
                  <Link href={`/properties/${p.id}`}>
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                    />
                  </Link>
                )}

                <div>
                  {p.featured && (
                    <span>
                      FEATURED
                    </span>
                  )}
                  <span>
                    {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                  </span>
                </div>

                <Link href={`/properties/${p.id}`}>
                  <strong>
                    {p.title}
                  </strong>
                </Link>

                <div>
                  <span>
                    {p.verified ? "Verified" : "Not Verified"}
                  </span>
                  {" "}
                  — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} —{" "}
                  {p.listingType === "SALE" ? "For sale" : "For rent"}
                </div>

                <div>
                  KSh {p.price.toLocaleString()}
                </div>

                <div>
                  {p.location}
                  {p.bedrooms !== null && <> — {p.bedrooms} bed</>}
                  {p.bathrooms !== null && <> — {p.bathrooms} bath</>}
                  {p.acreage !== null && <> — {p.acreage} acres</>}
                </div>

                <small>
                  Listed by {p.seller.name || p.seller.email} ({p.seller.role === "AGENT" ? "Agent" : "Owner"})
                  {p.seller.verified && (
                    <span>
                      {" "}
                      — Verified {p.seller.role === "AGENT" ? "Agent" : "Owner"}
                    </span>
                  )}
                  {p.representingName && <> — representing {p.representingName}</>}
                </small>

                {p.showContact && p.seller.phone && (
                  <small>
                    Contact: {p.seller.phone}
                  </small>
                )}

                {session?.user?.role === "BUYER" && (
                  <div>
                    <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <BuySellCard session={session} />


    </div>
  );
}