import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Notification, Property, Enquiry, SavedProperty, User, Prisma } from "@prisma/client";
import PropertyForm from "@/components/PropertyForm";
import AvailabilityForm from "@/components/AvailabilityForm";
import PropertyApprovalList from "@/components/PropertyApprovalList";
import AdminPropertyList from "@/components/AdminPropertyList";
import EnquiryApprovalList from "@/components/EnquiryApprovalList";
import AdminUserList from "@/components/AdminUserList";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import ResendVerificationButton from "@/components/ResendVerificationButton";
import PhoneForm from "@/components/PhoneForm";
import IdentityVerificationRequestForm from "@/components/IdentityVerificationRequestForm";
import { ROLE_LABELS, getRoleLabel } from "@/lib/propertyConstants";

type NotificationWithSender = Notification & {
  sender: Pick<User, "name" | "email" | "role">;
};

type PendingProperty = Property & {
  seller: Pick<User, "name" | "email" | "role" | "verified">;
};

type MyPropertyWithEnquiries = Property & {
  enquiries: (Enquiry & { buyer: Pick<User, "name" | "email"> })[];
  _count: { savedBy: number };
};

type ManagedProperty = Property & {
  seller: Pick<User, "name" | "email" | "phone" | "role" | "verified">;
  _count: { savedBy: number };
  documents: { id: string; documentType: string | null; verified: boolean }[];
};

type SavedWithProperty = SavedProperty & { property: Property };

type EnquiryWithProperty = Enquiry & { property: Pick<Property, "id" | "title"> };

type PendingEnquiry = Enquiry & {
  property: Pick<Property, "id" | "title">;
  buyer: Pick<User, "name" | "email">;
};

const STATUS_OPTIONS = ["PENDING", "APPROVED", "CHANGES_REQUESTED", "REJECTED"];
const ROLE_OPTIONS = ["BUYER", "OWNER", "AGENT", "ADMIN"];

type Tone = "role" | "success" | "warning" | "danger" | "accent" | "neutral";

function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const toneClasses = {
    role: "bg-[#123B2B] text-white",
    success: "bg-[#E4F5E9] text-[#17843C]",
    warning: "bg-[#FCF0DC] text-[#B4770E]",
    danger: "bg-[#FBE7E5] text-[#C0392B]",
    accent: "bg-[#E4F5E9] text-[#17843C]",
    neutral: "bg-[#EEF1EF] text-[#5B6660]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-0.5 text-xs font-semibold leading-6 ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}

function statusTone(status: string): Tone {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "CHANGES_REQUESTED":
      return "warning";
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
}

function enquiryStatusLabelAndTone(status: string): { label: string; tone: Tone } {
  if (status === "PENDING") return { label: "Awaiting admin review", tone: "warning" };
  if (status === "APPROVED") return { label: "Sent to seller", tone: "success" };
  return { label: "Not approved", tone: "danger" };
}

function Section({
  id,
  eyebrow,
  title,
  action,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white border border-[#E7EBE8] rounded-2xl p-6 md:p-7 shadow-[0_1px_3px_rgba(15,61,43,0.05)]">
      <div className="mb-4.5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7A72] m-0">{eyebrow}</p>
          <h2 className="text-lg font-bold mt-0.5 text-[#14231F]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function FilterForm({ children }: { children: React.ReactNode }) {
  return (
    <form method="get" className="flex items-end gap-2.5 flex-wrap">
      {children}
    </form>
  );
}

function IconHouse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9.5" r="2.3" />
      <path d="M15.8 14.2c2.3.2 4.2 2 4.2 4.8" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-7.5-4.6-9.6-9.1C1.1 7.9 2.6 5 5.7 4.6c1.9-.3 3.6.7 4.9 2.2 1.3-1.5 3-2.5 4.9-2.2 3.1.4 4.6 3.3 3.3 6.3C19.5 15.4 12 20 12 20Z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function StatCard({
  href,
  chip,
  icon,
  label,
  value,
}: {
  href: string;
  chip: "green" | "blue" | "amber" | "purple";
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const chipClasses = {
    green: "bg-[#E4F5E9] text-[#17843C]",
    blue: "bg-[#E5EEFB] text-[#2563AE]",
    amber: "bg-[#FCF0DC] text-[#B4770E]",
    purple: "bg-[#EFE7FA] text-[#7C4EC4]",
  };

  return (
    <div className="bg-white border border-[#E7EBE8] rounded-2xl p-4.5 shadow-[0_1px_3px_rgba(15,61,43,0.05)]">
      <div className="flex items-center gap-2.5">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${chipClasses[chip]}`}>
          <span className="w-4.5 h-4.5">{icon}</span>
        </span>
        <span className="text-sm font-medium text-[#566B60]">{label}</span>
      </div>
      <div className="mt-2.5 text-[1.9rem] font-bold text-[#14231F] leading-none">{value}</div>
      <Link href={href} className="inline-block mt-2 text-sm font-semibold text-[#17843C] hover:text-[#0F5D2A] no-underline">
        View all &rarr;
      </Link>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; userQ?: string; userRole?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.role) {
    redirect("/select-role");
  }

  const currentUserId = session.user.id;
  const role = session.user.role;

  const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.suspended) {
    return (
      <div className="min-h-screen bg-[#F4F6F5] font-sans text-[#17251E] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white border border-[#E7EBE8] rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(15,61,43,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C0392B] m-0">Account status</p>
          <h1 className="text-[1.6rem] font-bold mt-0.5 text-[#14231F]">Account suspended</h1>
          <p className="text-sm leading-6 text-[#566B60] mt-3">
            Your account has been suspended. Contact support if you believe this is a mistake.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    return (
      <div className="min-h-screen bg-[#F4F6F5] font-sans text-[#17251E] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white border border-[#E7EBE8] rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(15,61,43,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7A72] m-0">One step left</p>
          <h1 className="text-[1.6rem] font-bold mt-0.5 text-[#14231F]">Verify your email</h1>
          <p className="text-sm leading-6 text-[#566B60] mt-3">
            Please verify your email address (<strong>{currentUser.email}</strong>) before using
            your dashboard.
          </p>
          <p className="text-sm leading-6 text-[#566B60] mt-3">
            If you registered with email/password, you should have seen a verification link right
            after signing up. If you didn&apos;t click it (or it expired), generate a new one
            below.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <ResendVerificationButton />
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  const receivedNotifications: NotificationWithSender[] = await prisma.notification.findMany({
    where: { receiverId: currentUserId },
    include: { sender: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  const myProperties: MyPropertyWithEnquiries[] =
    role === "OWNER" || role === "AGENT"
      ? await prisma.property.findMany({
          where: { sellerId: currentUserId },
          include: {
            enquiries: {
              where: { status: "APPROVED" },
              include: { buyer: { select: { name: true, email: true } } },
            },
            _count: { select: { savedBy: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const pendingProperties: PendingProperty[] =
    role === "ADMIN"
      ? await prisma.property.findMany({
          where: { status: "PENDING" },
          include: { seller: { select: { name: true, email: true, role: true, verified: true } } },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const pendingEnquiries: PendingEnquiry[] =
    role === "ADMIN"
      ? await prisma.enquiry.findMany({
          where: { status: "PENDING" },
          include: {
            property: { select: { id: true, title: true } },
            buyer: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const statusFilter = searchParams.status && STATUS_OPTIONS.includes(searchParams.status) ? searchParams.status : undefined;
  const searchQuery = searchParams.q?.trim();

  const allPropertiesWhere: Prisma.PropertyWhereInput = searchQuery
    ? {
        seller: {
          OR: [{ name: { contains: searchQuery } }, { phone: { contains: searchQuery } }],
        },
      }
    : statusFilter
      ? { status: statusFilter }
      : {};

  const allProperties: ManagedProperty[] =
    role === "ADMIN"
      ? await prisma.property.findMany({
          where: allPropertiesWhere,
          include: {
            seller: { select: { name: true, email: true, phone: true, role: true, verified: true } },
            _count: { select: { savedBy: true } },
            documents: {
              select: { id: true, documentType: true, verified: true },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const userSearchQuery = searchParams.userQ?.trim();
  const userRoleFilter = searchParams.userRole && ROLE_OPTIONS.includes(searchParams.userRole) ? searchParams.userRole : undefined;

  const allUsersWhere: Prisma.UserWhereInput = userSearchQuery
    ? {
        OR: [
          { name: { contains: userSearchQuery } },
          { email: { contains: userSearchQuery } },
          { phone: { contains: userSearchQuery } },
        ],
      }
    : userRoleFilter
      ? { role: userRoleFilter }
      : {};

  const allUsers =
    role === "ADMIN"
      ? await prisma.user.findMany({
          where: allUsersWhere,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            suspended: true,
            verified: true,
            identityVerificationStatus: true,
            identityVerificationNote: true,
            identityVerificationRequestedAt: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const savedProperties: SavedWithProperty[] =
    role === "BUYER"
      ? await prisma.savedProperty.findMany({
          where: { buyerId: currentUserId },
          include: { property: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const myEnquiries: EnquiryWithProperty[] =
    role === "BUYER"
      ? await prisma.enquiry.findMany({
          where: { buyerId: currentUserId },
          include: { property: { select: { id: true, title: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const totalEnquiriesOnMyListings = myProperties.reduce((sum, p) => sum + p.enquiries.length, 0);
  const totalViewsOnMyListings = myProperties.reduce((sum, p) => sum + p.views, 0);
  const totalSavedOnMyListings = myProperties.reduce((sum, p) => sum + p._count.savedBy, 0);

  return (
    <div className="min-h-screen bg-[#F4F6F5] font-sans text-[#17251E]">
      <div className="max-w-[1120px] mx-auto px-5 py-8 pb-16 flex flex-col gap-6">
        {/* Header */}
        <header className="bg-white border border-[#E7EBE8] rounded-2xl p-6 md:p-7 md:flex-row flex flex-col gap-4 shadow-[0_1px_3px_rgba(15,61,43,0.05)] md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7A72] m-0">Dashboard</p>
            <h1 className="text-2xl font-bold mt-1 leading-tight text-[#14231F]">Welcome back, {session.user.name || session.user.email} 👋</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge label={getRoleLabel(role) || role} tone="role" />
              {(role === "OWNER" || role === "AGENT") && currentUser.verified && (
                <Badge label="Verified account" tone="success" />
              )}
              {(role === "OWNER" || role === "AGENT") && currentUser.identityVerificationStatus === "PENDING" && (
                <Badge label="Identity check pending" tone="warning" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <SignOutButton />
          </div>
        </header>

        {/* Stat row */}
        {(role === "OWNER" || role === "AGENT") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard href="#my-listings" chip="green" icon={<IconHouse />} label="My Properties" value={myProperties.length} />
            <StatCard href="#my-listings" chip="blue" icon={<IconPeople />} label="Enquiries" value={totalEnquiriesOnMyListings} />
            <StatCard href="#my-listings" chip="amber" icon={<IconEye />} label="Profile Views" value={totalViewsOnMyListings} />
            <StatCard href="#my-listings" chip="purple" icon={<IconHeart />} label="Saved by buyers" value={totalSavedOnMyListings} />
          </div>
        )}
        {role === "ADMIN" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard href="#pending-listings" chip="amber" icon={<IconHouse />} label="Pending Listings" value={pendingProperties.length} />
            <StatCard href="#pending-enquiries" chip="blue" icon={<IconMail />} label="Pending Enquiries" value={pendingEnquiries.length} />
            <StatCard href="#all-listings" chip="green" icon={<IconEye />} label="Total Listings" value={allProperties.length} />
            <StatCard href="#manage-users" chip="purple" icon={<IconPeople />} label="Total Users" value={allUsers.length} />
          </div>
        )}
        {role === "BUYER" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard href="#saved-properties" chip="purple" icon={<IconHeart />} label="Saved Properties" value={savedProperties.length} />
            <StatCard href="#my-enquiries" chip="blue" icon={<IconMail />} label="Enquiries Sent" value={myEnquiries.length} />
            <StatCard href="#notifications" chip="amber" icon={<IconEye />} label="Notifications" value={receivedNotifications.length} />
          </div>
        )}

        {/* Phone number */}
        <Section eyebrow="Contact" title="Phone number">
          <PhoneForm currentPhone={currentUser.phone} />
        </Section>

        {(role === "OWNER" || role === "AGENT") && (
          <Section eyebrow="Trust & safety" title="Identity verification">
            <IdentityVerificationRequestForm
              status={currentUser.identityVerificationStatus}
              note={currentUser.identityVerificationNote}
            />
          </Section>
        )}

        {(role === "OWNER" || role === "AGENT") && (
          <>
            <Section eyebrow="New listing" title="List a property">
              <PropertyForm isAgent={role === "AGENT"} identityVerificationStatus={currentUser.identityVerificationStatus} />
            </Section>

            <Section id="my-listings" eyebrow={`${myProperties.length} total`} title="Your listings">
              {myProperties.length === 0 ? (
                <p className="text-sm text-[#566B60] m-0">You haven&apos;t listed any properties yet.</p>
              ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
                  {myProperties.map((p) => {
                    return (
                      <li key={p.id} className="bg-white border border-[#E7EBE8] rounded-xl p-4.5 md:p-5 transition-shadow duration-150 ease-in hover:border-[#C7DECF] hover:shadow-[0_2px_8px_rgba(15,61,43,0.06)]">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-lg font-bold text-[#14231F]">{p.title}</strong>
                          <Badge label={p.status.replace("_", " ")} tone={statusTone(p.status)} />
                          {p.verified ? (
                            <Badge label="Verified" tone="success" />
                          ) : (
                            <Badge label="Not verified" tone="neutral" />
                          )}
                          {p.featured && <Badge label="Featured" tone="accent" />}
                        </div>

                        <div className="mt-2 text-lg font-bold text-[#123B2B]">KSh {p.price.toLocaleString()}</div>

                        {p.representingName && (
                          <div className="mt-1.5 text-sm text-[#566B60]">
                            Representing: {p.representingName}
                            {p.representingContact && <> ({p.representingContact})</>}
                          </div>
                        )}

                        <div className="mt-3">
                          <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                        </div>

                        <div className="mt-3 text-xs text-[#7C8A82]">
                          {p.views} views · {p._count.savedBy} saved · {p.enquiries.length} enquir
                          {p.enquiries.length === 1 ? "y" : "ies"}
                        </div>

                        {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                          <div className="mt-3 bg-[#FCF0DC] border border-[#F2DDAE] text-[#8A6A2E] rounded-xl px-3.5 py-2 text-sm italic">
                            Admin note: {p.adminNote}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2.5">
                          {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                            <Link href={`/properties/${p.id}/edit`} className="inline-flex items-center justify-center font-sans text-sm font-semibold text-[#123B2B] bg-white border border-[#DAE1DD] rounded-xl px-4.5 py-2 hover:bg-[#F4F6F5] hover:border-[#C7DECF] no-underline transition-colors duration-150">
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link href={`/properties/${p.id}/documents`} className="inline-flex items-center justify-center font-sans text-sm font-semibold text-[#123B2B] bg-white border border-[#DAE1DD] rounded-xl px-4.5 py-2 hover:bg-[#F4F6F5] hover:border-[#C7DECF] no-underline transition-colors duration-150">
                            Manage documents
                          </Link>
                        </div>

                        {p.enquiries.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[#EEF1EF]">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7A72] m-0 mb-2">Enquiries</p>
                            <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                              {p.enquiries.map((e: Enquiry & { buyer: Pick<User, "name" | "email"> }) => (
                                <li key={e.id} className="text-sm text-[#566B60]">
                                  <strong className="text-[#14231F]">{e.buyer.name || e.buyer.email}</strong>: {e.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          </>
        )}

        {role === "ADMIN" && (
          <>
            <Section id="pending-listings" eyebrow={`${pendingProperties.length} pending`} title="Listings awaiting review">
              <PropertyApprovalList properties={pendingProperties} />
            </Section>

            <Section id="pending-enquiries" eyebrow={`${pendingEnquiries.length} pending`} title="Enquiries awaiting review">
              <EnquiryApprovalList enquiries={pendingEnquiries} />
            </Section>

            <Section id="all-listings" eyebrow={`${allProperties.length} total`} title="All listings">
              <div className="flex flex-col gap-4 pb-5 border-b border-[#EEF1EF] mb-5 md:flex-row md:flex-wrap md:items-end md:justify-between">
                <FilterForm>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[#7C8A82]">Filter by status</label>
                    <select name="status" defaultValue={searchParams.status || ""} className="font-sans text-sm text-[#14231F] bg-white border border-[#DAE1DD] rounded-xl px-3.5 py-2 outline-none focus:shadow-[0_0_0_2px_#FFFFFF,0_0_0_4px_#17843C]">
                      <option value="">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="CHANGES_REQUESTED">Changes requested</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center font-sans text-sm font-semibold text-white bg-[#123B2B] border border-[#123B2B] rounded-xl px-4.5 py-2 cursor-pointer no-underline transition-colors duration-150 hover:bg-[#0D2B1F]">
                    Filter
                  </button>
                </FilterForm>

                <FilterForm>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[#7C8A82]">Search by seller name or phone</label>
                    <input
                      type="text"
                      name="q"
                      defaultValue={searchParams.q}
                      placeholder="e.g. Jane or 0712..."
                      className="font-sans text-sm text-[#14231F] bg-white border border-[#DAE1DD] rounded-xl px-3.5 py-2 w-auto md:w-55 outline-none focus:shadow-[0_0_0_2px_#FFFFFF,0_0_0_4px_#17843C]"
                    />
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center font-sans text-sm font-semibold text-white bg-[#123B2B] border border-[#123B2B] rounded-xl px-4.5 py-2 cursor-pointer no-underline transition-colors duration-150 hover:bg-[#0D2B1F]">
                    Search
                  </button>
                </FilterForm>

                <a href="/dashboard" className="text-sm font-semibold text-[#17843C] hover:text-[#0F5D2A] hover:underline no-underline">
                  Clear filters
                </a>
              </div>

              <div className="mt-1">
                <AdminPropertyList properties={allProperties} />
              </div>
            </Section>

            <Section id="manage-users" eyebrow={`${allUsers.length} total`} title="Manage users">
              <div className="flex flex-col gap-4 pb-5 border-b border-[#EEF1EF] mb-5 md:flex-row md:flex-wrap md:items-end md:justify-between">
                <FilterForm>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[#7C8A82]">Filter by role</label>
                    <select name="userRole" defaultValue={searchParams.userRole || ""} className="font-sans text-sm text-[#14231F] bg-white border border-[#DAE1DD] rounded-xl px-3.5 py-2 outline-none focus:shadow-[0_0_0_2px_#FFFFFF,0_0_0_4px_#17843C]">
                      <option value="">All</option>
                      <option value="BUYER">{ROLE_LABELS.BUYER}</option>
                      <option value="OWNER">{ROLE_LABELS.OWNER}</option>
                      <option value="AGENT">{ROLE_LABELS.AGENT}</option>
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    </select>
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center font-sans text-sm font-semibold text-white bg-[#123B2B] border border-[#123B2B] rounded-xl px-4.5 py-2 cursor-pointer no-underline transition-colors duration-150 hover:bg-[#0D2B1F]">
                    Filter
                  </button>
                </FilterForm>

                <FilterForm>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[#7C8A82]">Search by name, email, or phone</label>
                    <input
                      type="text"
                      name="userQ"
                      defaultValue={searchParams.userQ}
                      placeholder="e.g. Jane, jane@example.com, or 0712..."
                      className="font-sans text-sm text-[#14231F] bg-white border border-[#DAE1DD] rounded-xl px-3.5 py-2 w-auto md:w-55 outline-none focus:shadow-[0_0_0_2px_#FFFFFF,0_0_0_4px_#17843C]"
                    />
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center font-sans text-sm font-semibold text-white bg-[#123B2B] border border-[#123B2B] rounded-xl px-4.5 py-2 cursor-pointer no-underline transition-colors duration-150 hover:bg-[#0D2B1F]">
                    Search
                  </button>
                </FilterForm>

                <a href="/dashboard" className="text-sm font-semibold text-[#17843C] hover:text-[#0F5D2A] hover:underline no-underline">
                  Clear filters
                </a>
              </div>

              <div className="mt-1">
                <AdminUserList users={allUsers} currentUserId={currentUserId} />
              </div>
            </Section>
          </>
        )}

        {role === "BUYER" && (
          <>
            <Section eyebrow="Explore" title="Browse properties">
              <p className="text-sm leading-6 text-[#566B60] mt-3">
                Browse properties on the{" "}
                <Link href="/" className="text-sm font-semibold text-[#17843C] hover:text-[#0F5D2A] hover:underline no-underline">
                  homepage
                </Link>
                .
              </p>
            </Section>

            <Section id="saved-properties" eyebrow={`${savedProperties.length} saved`} title="Your saved properties">
              {savedProperties.length === 0 ? (
                <p className="text-sm text-[#566B60] m-0">You haven&apos;t saved any properties yet.</p>
              ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
                  {savedProperties.map((s) => (
                    <li key={s.id} className="list-none flex items-center justify-between gap-3 bg-white border border-[#E7EBE8] rounded-xl px-4 py-3">
                      <Link href={`/properties/${s.property.id}`} className="font-semibold text-[#14231F] hover:text-[#17843C] no-underline">
                        {s.property.title}
                      </Link>
                      <span className="text-sm font-semibold text-[#566B60] whitespace-nowrap">KSh {s.property.price.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section id="my-enquiries" eyebrow={`${myEnquiries.length} sent`} title="Your enquiries">
              {myEnquiries.length === 0 ? (
                <p className="text-sm text-[#566B60] m-0">You haven&apos;t sent any enquiries yet.</p>
              ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
                  {myEnquiries.map((e: EnquiryWithProperty) => {
                    const { label, tone } = enquiryStatusLabelAndTone(e.status);
                    return (
                      <li key={e.id} className="bg-white border border-[#E7EBE8] rounded-xl p-4.5 md:p-5 transition-shadow duration-150 ease-in hover:border-[#C7DECF] hover:shadow-[0_2px_8px_rgba(15,61,43,0.06)]">
                        <Link href={`/properties/${e.property.id}`} className="text-lg font-bold text-[#14231F] hover:text-[#17843C] no-underline block">
                          {e.property.title}
                        </Link>
                        <div className="text-sm text-[#566B60] mt-1">{e.message}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge label={label} tone={tone} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          </>
        )}

        {/* Notifications */}
        <Section id="notifications" eyebrow={`${receivedNotifications.length} total`} title="Notifications">
          {receivedNotifications.length === 0 ? (
            <p className="text-sm text-[#566B60] m-0">No notifications yet.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
              {receivedNotifications.map((n) => (
                <li key={n.id} className="bg-white border border-[#E7EBE8] rounded-xl p-3.5 md:p-4 transition-shadow duration-150 ease-in hover:border-[#C7DECF] hover:shadow-[0_2px_8px_rgba(15,61,43,0.06)]">
                  {n.propertyId ? (
                    <Link href={`/properties/${n.propertyId}`} className="text-sm font-semibold text-[#14231F] hover:text-[#17843C] no-underline">
                      {n.message}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-[#14231F]">{n.message}</span>
                  )}
                  <div className="text-xs text-[#7C8A82] mt-1.5 block">
                    From {n.sender.name || n.sender.email} — {new Date(n.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}