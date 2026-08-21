import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import NotificationBell from "@/components/NotificationBell";

import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
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

const AVAILABILITY_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  RESERVED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  SOLD: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  RENTED: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
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
    <div className="bg-[#F7F8F6]">

      {/* Hero + search */}
      <div className="relative overflow-hidden bg-[#0E3B2E]">
        {/* soft background glow, subject-appropriate: skyline silhouette feel without an image asset */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
          <div className="absolute -right-24 top-0 h-full w-2/3 bg-gradient-to-l from-white to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-14 pb-40 sm:px-8">
          <header className="max-w-2xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
              East Africa&apos;s Trusted Marketplace for{" "}
              <span className="text-[#C99A3A]">Verified Properties</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-emerald-100/80 sm:text-lg">
              Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
            </p>

            {session?.user ? (
              <p className="mt-6 flex items-center gap-4 text-sm font-medium text-white">
                <NotificationBell />
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-[#C99A3A] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#b8862b]"
                >
                  Go to your dashboard
                </Link>
              </p>
            ) : (
              <p className="mt-6 flex items-center gap-3 text-sm font-semibold">
                <Link
                  href="/login"
                  className="rounded-lg border border-white/25 px-5 py-2.5 text-white transition hover:bg-white/10"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[#C99A3A] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#b8862b]"
                >
                  Create an account
                </Link>
              </p>
            )}
          </header>
        </div>

        {/* Search card — floats over the hero/listings boundary like the reference */}
        <section className="relative z-10 mx-auto -mt-24 max-w-6xl px-6 sm:px-8">
          <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
            <h2 className="mb-5 text-lg font-bold text-[#0E3B2E]">Find a Property</h2>

            <form method="get">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Location / County
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={searchParams.location}
                    placeholder="e.g. Kitengela"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#0E3B2E] focus:bg-white focus:ring-1 focus:ring-[#0E3B2E]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Property Type
                  </label>
                  <select
                    name="propertyType"
                    defaultValue={searchParams.propertyType || ""}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#0E3B2E] focus:bg-white focus:ring-1 focus:ring-[#0E3B2E]"
                  >
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PROPERTY_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Buy or Rent
                  </label>
                  <select
                    name="listingType"
                    defaultValue={searchParams.listingType || ""}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#0E3B2E] focus:bg-white focus:ring-1 focus:ring-[#0E3B2E]"
                  >
                    <option value="">Any</option>
                    <option value="SALE">For sale</option>
                    <option value="RENT">For rent</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Availability
                  </label>
                  <select
                    name="availabilityStatus"
                    defaultValue={searchParams.availabilityStatus || ""}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#0E3B2E] focus:bg-white focus:ring-1 focus:ring-[#0E3B2E]"
                  >
                    <option value="">Any</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Min Price (KSh)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={searchParams.minPrice}
                    min="0"
                    placeholder="Any"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#0E3B2E] focus:bg-white focus:ring-1 focus:ring-[#0E3B2E]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Max Price (KSh)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={searchParams.maxPrice}
                    min="0"
                    placeholder="Any"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#0E3B2E] focus:bg-white focus:ring-1 focus:ring-[#0E3B2E]"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button
                  type="submit"
                  className="rounded-lg bg-[#C99A3A] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8862b]"
                >
                  Search Properties
                </button>
                <a
                  href="/"
                  className="text-sm font-medium text-gray-500 underline-offset-2 transition hover:text-[#0E3B2E] hover:underline"
                >
                  Clear filters
                </a>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Listings */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#0E3B2E]">
            Verified Listings <span className="text-gray-400">({properties.length})</span>
          </h2>
        </div>

        {properties.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
            No properties match your search. Try adjusting your filters.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((p: PropertyWithSeller) => (
              <li
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {p.imageUrl && (
                  <Link href={`/properties/${p.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {p.featured && (
                        <span className="rounded-md bg-[#0E3B2E] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          Featured
                        </span>
                      )}
                      {p.daktopVerified && (
                        <span className="rounded-md bg-[#C99A3A] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          Daktop Verified
                        </span>
                      )}
                    </div>
                    <span
                      className={`absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        AVAILABILITY_STYLES[p.availabilityStatus] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                      }`}
                    >
                      {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                    </span>
                  </Link>
                )}

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link href={`/properties/${p.id}`}>
                    <strong className="line-clamp-1 text-base font-bold text-gray-900 transition group-hover:text-[#0E3B2E]">
                      {p.title}
                    </strong>
                  </Link>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-500">
                    <span
                      className={
                        p.verified
                          ? "text-emerald-600"
                          : "text-gray-400"
                      }
                    >
                      {p.verified ? "Verified" : "Not Verified"}
                    </span>
                    <span className="text-gray-300">—</span>
                    <span>{getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)}</span>
                    <span className="text-gray-300">—</span>
                    <span>{p.listingType === "SALE" ? "For sale" : "For rent"}</span>
                  </div>

                  <div className="text-lg font-extrabold text-[#0E3B2E]">
                    KSh {p.price.toLocaleString()}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                    <span>{p.location}</span>
                    {p.bedrooms !== null && <span>— {p.bedrooms} bed</span>}
                    {p.bathrooms !== null && <span>— {p.bathrooms} bath</span>}
                    {p.acreage !== null && <span>— {p.acreage} acres</span>}
                  </div>

                  <hr className="my-1 border-gray-100" />

                  <small className="text-xs text-gray-500">
                    Listed by{" "}
                    <span className="font-medium text-gray-700">{p.seller.name || p.seller.email}</span>{" "}
                    ({getRoleLabel(p.seller.role)})
                    {p.seller.verified && (
                      <span className="text-emerald-600"> — Verified {getRoleLabel(p.seller.role)}</span>
                    )}
                    {p.representingName && <> — representing {p.representingName}</>}
                  </small>

                  {p.showContact && p.seller.phone && (
                    <small className="text-xs font-medium text-gray-600">
                      Contact: {p.seller.phone}
                    </small>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2">
                    {session?.user?.role === "BUYER" && (
                      <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20 sm:px-8">
        <BuySellCard session={session} />
      </div>

    </div>
  );
}
