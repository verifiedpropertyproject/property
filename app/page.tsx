=import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import NotificationBell from "@/components/NotificationBell";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";

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
  RENTED: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
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
    <div className="bg-slate-50">

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
              <NotificationBell />
              {" "}
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

        {/* Search / filter card */}
        <section className="max-w-6xl mx-auto px-4 -mt-4 relative z-10">
          <div className="rounded-2xl bg-emerald-900 shadow-xl shadow-emerald-900/20 p-5 sm:p-6">
            <h2 className="text-white/90 font-semibold text-sm uppercase tracking-wide mb-4">
              Find a Property
            </h2>

            <form method="get">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-emerald-100 mb-1">
                    Location / County
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="location"
                      defaultValue={searchParams.location}
                      placeholder="e.g. Kitengela"
                      className="w-full rounded-lg border-0 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-100 mb-1">
                    Property Type
                  </label>
                  <select
                    name="propertyType"
                    defaultValue={searchParams.propertyType || ""}
                    className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                  <label className="block text-xs font-medium text-emerald-100 mb-1">
                    Buy or Rent
                  </label>
                  <select
                    name="listingType"
                    defaultValue={searchParams.listingType || ""}
                    className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Any</option>
                    <option value="SALE">For sale</option>
                    <option value="RENT">For rent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-100 mb-1">
                    Availability
                  </label>
                  <select
                    name="availabilityStatus"
                    defaultValue={searchParams.availabilityStatus || ""}
                    className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Any</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-100 mb-1">
                    Min Price (KSh)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={searchParams.minPrice}
                    min="0"
                    placeholder="Any"
                    className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-100 mb-1">
                    Max Price (KSh)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={searchParams.maxPrice}
                    min="0"
                    placeholder="Any"
                    className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 transition-colors px-6 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm"
                >
                  <Search className="h-4 w-4" />
                  Search Properties
                </button>
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-100 hover:text-white"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Clear filters
                </a>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Listings */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Verified Listings <span className="text-slate-400 font-medium">({properties.length})</span>
          </h2>
        </div>

        {properties.length === 0 ? (
          <p className="text-slate-500 bg-white border border-slate-200 rounded-xl p-8 text-center">
            No properties match your search. Try adjusting your filters.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p: PropertyWithSeller) => (
              <li
                key={p.id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
              >
                <div className="relative">
                  {p.imageUrl && (
                    <Link href={`/properties/${p.id}`} className="block aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  )}

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {p.featured && (
                      <span className="rounded-md bg-emerald-800 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                        Featured
                      </span>
                    )}
                    {p.daktopVerified && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-950 shadow">
                        <ShieldCheck className="h-3 w-3" />
                        Daktop Verified
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {session?.user?.role === "BUYER" && (
                      <div className="rounded-full bg-white/90 backdrop-blur p-1.5 shadow">
                        <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                      </div>
                    )}
                  </div>

                  <span
                    className={`absolute bottom-3 left-3 rounded-md px-2 py-1 text-[11px] font-semibold ${
                      AVAILABILITY_STYLES[p.availabilityStatus] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                    }`}
                  >
                    {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-4 gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        p.verified ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {p.verified && <BadgeCheck className="h-3.5 w-3.5" />}
                      {p.verified ? "Verified" : "Not Verified"}
                    </span>
                    <span>&middot;</span>
                    <span>{getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)}</span>
                    <span>&middot;</span>
                    <span>{p.listingType === "SALE" ? "For sale" : "For rent"}</span>
                  </div>

                  <Link href={`/properties/${p.id}`}>
                    <strong className="block text-base font-semibold text-slate-900 leading-snug hover:text-emerald-800 transition-colors">
                      {p.title}
                    </strong>
                  </Link>

                  <div className="text-lg font-bold text-emerald-800">
                    KSh {p.price.toLocaleString()}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{p.location}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 pt-1 border-t border-slate-100 mt-1">
                    {p.bedrooms !== null && (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-4 w-4 text-slate-400" />
                        {p.bedrooms} bed
                      </span>
                    )}
                    {p.bathrooms !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Bath className="h-4 w-4 text-slate-400" />
                        {p.bathrooms} bath
                      </span>
                    )}
                    {p.acreage !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="h-4 w-4 text-slate-400" />
                        {p.acreage} acres
                      </span>
                    )}
                  </div>

                  <div className="pt-2 mt-auto text-xs text-slate-500 leading-relaxed">
                    <div>
                      Listed by{" "}
                      <span className="font-medium text-slate-700">
                        {p.seller.name || p.seller.email}
                      </span>{" "}
                      ({getRoleLabel(p.seller.role)})
                      {p.seller.verified && (
                        <span className="text-emerald-700 font-medium">
                          {" "}
                          — Verified {getRoleLabel(p.seller.role)}
                        </span>
                      )}
                      {p.representingName && <> — representing {p.representingName}</>}
                    </div>

                    {p.showContact && p.seller.phone && (
                      <div className="mt-1 font-medium text-slate-700">
                        Contact: {p.seller.phone}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BuySellCard session={session} />


    </div>
  );
}
