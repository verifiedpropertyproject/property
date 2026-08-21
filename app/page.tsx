import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Prisma, Property, User } from "@prisma/client";
import SaveButton from "@/components/SaveButton";
import NotificationBell from "@/components/NotificationBell";
import BuySellCard from "@/components/BuySellCard";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, getPropertyTypeLabel, getRoleLabel } from "@/lib/propertyConstants";
import { Search, MapPin, Bed, Bath, Maximize2, ShieldCheck, XCircle, ArrowRight, Phone } from "lucide-react";

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

// --- Color Palette ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  pageBg: "#FFFFFF",
  sectionBg: "#F7FAF8",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

const inputStyles = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#1F7A4C] focus:ring-2 focus:ring-[#1F7A4C]/20 transition-all bg-white placeholder:text-gray-400";
const labelStyles = "block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider";

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
    <div style={{ backgroundColor: COLORS.pageBg }} className="min-h-screen text-gray-900 font-sans antialiased overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* --- Hero Section: Intro + Search Panel --- */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Intro Column */}
          <header className="lg:col-span-4 space-y-4 pt-2">
            <span 
              style={{ backgroundColor: COLORS.lightGreenBg, color: COLORS.primaryGreen }} 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            >
              <ShieldCheck className="w-4 h-4" /> Verified Properties
            </span>
            
            <h1 
              style={{ color: COLORS.darkGreen }} 
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
            >
              East Africa&apos;s Trusted Marketplace for Verified Properties
            </h1>
            
            <p style={{ color: COLORS.textGray }} className="leading-relaxed text-sm">
              Buy and sell land, homes and commercial property with verified ownership and professional due diligence.
            </p>

            <div className="pt-2">
              {session?.user ? (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm w-fit">
                  <NotificationBell />
                  <Link 
                    href="/dashboard" 
                    style={{ color: COLORS.primaryGreen }} 
                    className="text-sm font-semibold hover:underline flex items-center gap-1 transition-colors"
                  >
                    Go to your dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                  <Link href="/login" style={{ color: COLORS.primaryGreen }} className="hover:underline font-semibold">
                    Log in
                  </Link>
                  <span>|</span>
                  <Link 
                    href="/register" 
                    style={{ backgroundColor: COLORS.primaryGreen }} 
                    className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-all shadow-sm font-semibold"
                  >
                    Create an account
                  </Link>
                </div>
              )}
            </div>
          </header>

          {/* Right Filter Panel */}
          <section 
            style={{ backgroundColor: COLORS.sectionBg, borderColor: COLORS.border }} 
            className="lg:col-span-8 p-6 sm:p-8 rounded-2xl border shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ color: COLORS.darkGreen }} className="text-lg font-bold flex items-center gap-2">
                <Search style={{ color: COLORS.primaryGreen }} className="w-5 h-5" /> Find a Property
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
                      <option key={t} value={t}>
                        {PROPERTY_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelStyles}>Buy or Rent</label>
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
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={searchParams.minPrice}
                    min="0"
                    placeholder="Any"
                    className={inputStyles}
                  />
                </div>

                <div>
                  <label className={labelStyles}>Max Price (KSh)</label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={searchParams.maxPrice}
                    min="0"
                    placeholder="Any"
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  type="submit"
                  style={{ backgroundColor: COLORS.primaryGreen }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all shadow-md hover:opacity-90 active:scale-[0.98] cursor-pointer"
                >
                  Search Properties
                </button>
                <a 
                  href="/" 
                  style={{ color: COLORS.primaryGreen }} 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Clear filters
                </a>
              </div>
            </form>
          </section>
        </div>

        <hr style={{ borderColor: COLORS.border }} />

        {/* --- Listings Grid --- */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 style={{ color: COLORS.darkGreen }} className="text-xl font-bold">
              Verified Listings ({properties.length})
            </h2>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p style={{ color: COLORS.textGray }} className="font-medium">
                No properties match your search. Try adjusting your filters.
              </p>
              <a href="/" style={{ color: COLORS.primaryGreen }} className="mt-3 inline-block text-sm font-semibold hover:underline">
                Reset filters
              </a>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 list-none p-0 m-0">
              {properties.map((p: PropertyWithSeller) => (
                <li
                  key={p.id}
                  style={{ backgroundColor: COLORS.white, borderColor: COLORS.border }}
                  className="group rounded-2xl border p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0B2E1F]/5"
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
                      </Link>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {p.featured && (
                        <span 
                          style={{ backgroundColor: COLORS.darkGreen }} 
                          className="text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase"
                        >
                          FEATURED
                        </span>
                      )}
                      {p.daktopVerified && (
                        <span 
                          style={{ backgroundColor: COLORS.primaryGreen }} 
                          className="text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase"
                        >
                          DAKTOP VERIFIED
                        </span>
                      )}
                      <span 
                        style={{ backgroundColor: COLORS.lightGreenBg, color: COLORS.primaryGreen }} 
                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                      >
                        {AVAILABILITY_LABELS[p.availabilityStatus] || p.availabilityStatus}
                      </span>
                    </div>

                    {/* Title */}
                    <Link href={`/properties/${p.id}`} className="block">
                      <strong 
                        style={{ color: COLORS.textDark }} 
                        className="font-bold text-base line-clamp-2 leading-snug group-hover:text-[#1F7A4C] transition-colors"
                      >
                        {p.title}
                      </strong>
                    </Link>

                    {/* Sub-info */}
                    <div style={{ color: COLORS.textGray }} className="text-xs space-x-1 truncate">
                      <span className={p.verified ? "text-[#1F7A4C] font-semibold" : "text-gray-500 font-semibold"}>
                        {p.verified ? "Verified" : "Not Verified"}
                      </span>
                      <span>—</span>
                      <span>{getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)}</span>
                      <span>—</span>
                      <span>{p.listingType === "SALE" ? "For sale" : "For rent"}</span>
                    </div>

                    {/* Price */}
                    <div style={{ color: COLORS.primaryGreen }} className="text-lg font-extrabold">
                      KSh {p.price.toLocaleString()}
                    </div>

                    {/* Location & Specs */}
                    <div style={{ color: COLORS.textGray }} className="space-y-1.5 pt-1 text-xs border-t border-gray-100">
                      <div className="flex items-center gap-1 font-medium text-gray-700 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-500 pt-0.5">
                        {p.bedrooms !== null && (
                          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {p.bedrooms} bed</span>
                        )}
                        {p.bathrooms !== null && (
                          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms} bath</span>
                        )}
                        {p.acreage !== null && (
                          <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" /> {p.acreage} acres</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seller Details & Save Button */}
                  <div style={{ color: COLORS.textGray }} className="mt-4 pt-3 border-t border-gray-100 text-xs space-y-1.5">
                    <p className="line-clamp-1">
                      Listed by {p.seller.name || p.seller.email} ({getRoleLabel(p.seller.role)})
                      {p.seller.verified && (
                        <span style={{ color: COLORS.primaryGreen }} className="font-semibold">
                          {" "}— Verified {getRoleLabel(p.seller.role)}
                        </span>
                      )}
                      {p.representingName && <> — representing {p.representingName}</>}
                    </p>

                    {p.showContact && p.seller.phone && (
                      <div style={{ color: COLORS.textDark }} className="font-semibold flex items-center gap-1 pt-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> Contact: {p.seller.phone}
                      </div>
                    )}

                    {session?.user?.role === "BUYER" && (
                      <div className="pt-2">
                        <SaveButton propertyId={p.id} initiallySaved={savedPropertyIds.has(p.id)} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <BuySellCard session={session} />
      </main>
    </div>
  );
}