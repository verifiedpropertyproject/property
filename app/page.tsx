import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import NotificationBell from "@/components/NotificationBell";
import BuySellCard from "@/components/BuySellCard";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
import { Search, MapPin, Bed, Bath, Maximize2, ShieldCheck, XCircle, ArrowRight } from "lucide-react";

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

const inputStyles = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#1F7A4C] focus:ring-2 focus:ring-[#1F7A4C]/20 transition-all bg-white placeholder:text-gray-400";
const labelStyles = "block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider";

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);

  const where: Prisma.PropertyWhereInput = { status: "APPROVED", seller: { suspended: false } };

  if (searchParams.location) where.location = { contains: searchParams.location };
  if (searchParams.propertyType) where.propertyType = searchParams.propertyType;
  if (searchParams.listingType) where.listingType = searchParams.listingType;
  if (searchParams.availabilityStatus) where.availabilityStatus = searchParams.availabilityStatus;
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
    <div className="min-h-screen bg-slate-50/50 text-gray-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* --- Hero Section --- */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Intro Column */}
          <header className="lg:col-span-4 space-y-4 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5EC] text-[#1F7A4C]">
              <ShieldCheck className="w-4 h-4" /> 100% Verified Listings
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B2E1F] tracking-tight leading-tight">
              East Africa&apos;s Trusted Real Estate Marketplace
            </h1>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Buy and sell land, homes, and commercial properties with verified ownership and transparent background checks.
            </p>

            <div className="pt-2">
              {session?.user ? (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm w-fit">
                  <NotificationBell />
                  <Link href="/dashboard" className="text-sm font-semibold text-[#1F7A4C] hover:text-[#176339] flex items-center gap-1 transition-colors">
                    Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                  <Link href="/login" className="text-[#1F7A4C] hover:underline font-semibold">Log in</Link>
                  <span>•</span>
                  <Link href="/register" className="px-4 py-2 rounded-lg bg-[#1F7A4C] text-white hover:bg-[#176339] transition-all shadow-sm">
                    Create an account
                  </Link>
                </div>
              )}
            </div>
          </header>

          {/* Right Filter Panel */}
          <section className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0B2E1F] flex items-center gap-2">
                <Search className="w-5 h-5 text-[#1F7A4C]" /> Find a Property
              </h2>
            </div>

            <form method="get" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelStyles}>Location / County</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={searchParams.location}
                    placeholder="e.g. Kitengela"
                    className={inputStyles}
                  />
                </div>

                <div>
                  <label className={labelStyles}>Property Type</label>
                  <select name="propertyType" defaultValue={searchParams.propertyType || ""} className={inputStyles}>
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelStyles}>Listing Type</label>
                  <select name="listingType" defaultValue={searchParams.listingType || ""} className={inputStyles}>
                    <option value="">Any</option>
                    <option value="SALE">For sale</option>
                    <option value="RENT">For rent</option>
                  </select>
                </div>

                <div>
                  <label className={labelStyles}>Availability</label>
                  <select name="availabilityStatus" defaultValue={searchParams.availabilityStatus || ""} className={inputStyles}>
                    <option value="">Any</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>

                <div>
                  <label className={labelStyles}>Min Price (KSh)</label>
                  <input type="number" name="minPrice" defaultValue={searchParams.minPrice} min="0" placeholder="Any" className={inputStyles} />
                </div>

                <div>
                  <label className={labelStyles}>Max Price (KSh)</label>
                  <input type="number" name="maxPrice" defaultValue={searchParams.maxPrice} min="0" placeholder="Any" className={inputStyles} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1F7A4C] hover:bg-[#176339] text-white font-semibold text-sm transition-all shadow-md shadow-[#1F7A4C]/10 active:scale-[0.98]"
                >
                  Search Properties
                </button>
                <a href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors">
                  <XCircle className="w-4 h-4" /> Clear filters
                </a>
              </div>
            </form>
          </section>
        </div>

        {/* --- Listings Grid --- */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-[#0B2E1F]">
              Verified Listings <span className="text-sm font-semibold text-[#1F7A4C] bg-[#E8F5EC] px-2.5 py-0.5 rounded-full ml-2">{properties.length}</span>
            </h2>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500 font-medium">No properties match your exact search criteria.</p>
              <a href="/" className="mt-3 inline-block text-sm text-[#1F7A4C] font-semibold hover:underline">Reset filters</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((p: PropertyWithSeller) => (
                <article
                  key={p.id}
                  className="group bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0B2E1F]/5 hover:border-[#1F7A4C]/30"
                >
                  <div className="space-y-3">
                    {/* Property Image Container */}
                    {p.imageUrl && (
                      <Link href={`/properties/${p.id}`} className="block relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          {p.featured && (
                            <span className="bg-[#0B2E1F] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                              Featured
                            </span>
                          )}
                          {p.daktopVerified && (
                            <span className="bg-[#1F7A4C] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                              Verified
                            </span>
                          )}
                        </div>
                      </Link>
                    )}

                    {/* Status & Type Labels */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#1F7A4C] bg-[#E8F5EC] px-2 py-0.5 rounded-md">
                        {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                      </span>
                      <span className="text-gray-500 uppercase tracking-wider text-[11px]">
                        {p.listingType === "SALE" ? "For Sale" : "For Rent"}
                      </span>
                    </div>

                    {/* Title */}
                    <Link href={`/properties/${p.id}`} className="block group-hover:text-[#1F7A4C] transition-colors">
                      <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug">
                        {p.title}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="text-lg font-extrabold text-[#1F7A4C]">
                      KSh {p.price.toLocaleString()}
                    </div>

                    {/* Location & Specs */}
                    <div className="space-y-1.5 pt-1 text-xs text-gray-600 border-t border-gray-100">
                      <div className="flex items-center gap-1 font-medium text-gray-700 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-500 pt-1">
                        {p.bedrooms !== null && (
                          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {p.bedrooms} beds</span>
                        )}
                        {p.bathrooms !== null && (
                          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms} baths</span>
                        )}
                        {p.acreage !== null && (
                          <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" /> {p.acreage} ac</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seller Details & Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-2">
                    <p className="line-clamp-1">
                      By <span className="font-medium text-gray-800">{p.seller.name || p.seller.email}</span> ({getRoleLabel(p.seller.role)})
                    </p>
                    
                    {p.showContact && p.seller.phone && (
                      <div className="font-semibold text-gray-900 bg-gray-50 p-2 rounded-lg text-center">
                        📞 {p.seller.phone}
                      </div>
                    )}

                    {session?.user?.role === "BUYER" && (
                      <div className="pt-2">
                        <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* CTA Card */}
        <BuySellCard session={session} />
      </main>
    </div>
  );
}