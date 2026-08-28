import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Notification, Property, Enquiry, ViewingRequest, SavedProperty, User, Prisma } from "@prisma/client";
import PropertyForm from "@/components/PropertyForm";
import AvailabilityForm from "@/components/AvailabilityForm";
import PropertyApprovalList from "@/components/PropertyApprovalList";
import AdminPropertyList from "@/components/AdminPropertyList";
import EnquiryApprovalList from "@/components/EnquiryApprovalList";
import ViewingRequestApprovalList from "@/components/ViewingRequestApprovalList";
import AdminUserList from "@/components/AdminUserList";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import ResendVerificationButton from "@/components/ResendVerificationButton";
import PhoneForm from "@/components/PhoneForm";
import ProfileNameForm from "@/components/ProfileNameForm";
import IdentityVerificationRequestForm from "@/components/IdentityVerificationRequestForm";
import { ROLE_LABELS, getRoleLabel, getPropertyTypeLabel } from "@/lib/propertyConstants";
import { getAvailabilityLabel } from "@/lib/availabilityStatus";
import SaveButton from "@/components/SaveButton";

type NotificationWithSender = Notification & {
  sender: Pick<User, "name" | "email" | "role">;
};

type PendingProperty = Property & {
  seller: Pick<User, "name" | "email" | "role" | "verified">;
};

type MyPropertyWithEnquiries = Property & {
  enquiries: (Enquiry & { buyer: Pick<User, "name" | "email"> })[];
  viewingRequests: (ViewingRequest & { buyer: Pick<User, "name" | "email"> })[];
  _count: { savedBy: number };
};

type ManagedProperty = Property & {
  seller: Pick<User, "name" | "email" | "phone" | "role" | "verified">;
  _count: { savedBy: number };
  documents: { id: string; documentType: string | null; verified: boolean }[];
};

type SavedWithProperty = SavedProperty & {
  property: Property & { seller: Pick<User, "name" | "email" | "role"> };
};

type EnquiryWithProperty = Enquiry & {
  property: Pick<Property, "id" | "title" | "price" | "imageUrl" | "location" | "availabilityStatus">;
};

type PendingEnquiry = Enquiry & {
  property: Pick<Property, "id" | "title">;
  buyer: Pick<User, "name" | "email">;
};

type ViewingRequestWithProperty = ViewingRequest & {
  property: Pick<Property, "id" | "title" | "price" | "imageUrl" | "location" | "availabilityStatus">;
};

type PendingViewingRequest = ViewingRequest & {
  property: Pick<Property, "id" | "title">;
  buyer: Pick<User, "name" | "email">;
};

const STATUS_OPTIONS = ["PENDING", "APPROVED", "CHANGES_REQUESTED", "REJECTED"];
const ROLE_OPTIONS = ["BUYER", "OWNER", "AGENT", "ADMIN"];

type Tone = "role" | "success" | "warning" | "danger" | "accent" | "neutral";

function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const toneClasses = {
    role: "bg-[var(--dk-dark)] text-white",
    success: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)]",
    warning: "bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)]",
    danger: "bg-[var(--dk-danger-bg)] text-[var(--dk-danger-ink)]",
    accent: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)]",
    neutral: "bg-[var(--dk-border)] text-[var(--dk-muted)]",
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

function availabilityTone(status: string): Tone {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "RESERVED":
      return "warning";
    case "SOLD":
    case "RENTED":
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

function viewingRequestStatusLabelAndTone(status: string): { label: string; tone: Tone } {
  if (status === "PENDING") return { label: "Pending", tone: "warning" };
  if (status === "APPROVED") return { label: "Confirmed", tone: "success" };
  return { label: "Declined", tone: "danger" };
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
    <section id={id} className="bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-2xl p-6 md:p-7 shadow-[0_1px_3px_var(--dk-shadow)]">
      <div className="mb-4.5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dk-muted)] m-0">{eyebrow}</p>
          <h2 className="[font-family:var(--font-display)] text-lg font-semibold mt-0.5 text-[var(--dk-heading)]">{title}</h2>
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

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
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
    green: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)]",
    blue: "bg-[var(--dk-info-bg)] text-[var(--dk-info-ink)]",
    amber: "bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)]",
    purple: "bg-[var(--dk-purple-bg)] text-[var(--dk-purple-ink)]",
  };

  return (
    <div className="bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-2xl p-4.5 shadow-[0_1px_3px_var(--dk-shadow)]">
      <div className="flex items-center gap-2.5">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${chipClasses[chip]}`}>
          <span className="w-4.5 h-4.5">{icon}</span>
        </span>
        <span className="text-sm font-medium text-[var(--dk-muted)]">{label}</span>
      </div>
      <div className="mt-2.5 text-[1.9rem] font-bold text-[var(--dk-heading)] leading-none">{value}</div>
      <Link href={href} className="inline-block mt-2 text-sm font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)] no-underline">
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
      <div className="min-h-screen bg-[var(--dk-ivory)] font-sans text-[var(--dk-ink)] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-2xl p-8 text-center shadow-[0_1px_3px_var(--dk-shadow)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dk-danger-ink)] m-0">Account status</p>
          <h1 className="text-[1.6rem] font-bold mt-0.5 text-[var(--dk-heading)]">Account suspended</h1>
          <p className="text-sm leading-6 text-[var(--dk-muted)] mt-3">
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
      <div className="min-h-screen bg-[var(--dk-ivory)] font-sans text-[var(--dk-ink)] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-2xl p-8 text-center shadow-[0_1px_3px_var(--dk-shadow)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dk-muted)] m-0">One step left</p>
          <h1 className="text-[1.6rem] font-bold mt-0.5 text-[var(--dk-heading)]">Verify your email</h1>
          <p className="text-sm leading-6 text-[var(--dk-muted)] mt-3">
            Please verify your email address (<strong>{currentUser.email}</strong>) before using
            your dashboard.
          </p>
          <p className="text-sm leading-6 text-[var(--dk-muted)] mt-3">
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
            viewingRequests: {
              where: { status: "APPROVED" },
              include: { buyer: { select: { name: true, email: true } } },
              orderBy: { preferredDate: "asc" },
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

  const pendingViewingRequests: PendingViewingRequest[] =
    role === "ADMIN"
      ? await prisma.viewingRequest.findMany({
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
          include: {
            property: {
              include: {
                seller: { select: { name: true, email: true, role: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const myEnquiries: EnquiryWithProperty[] =
    role === "BUYER"
      ? await prisma.enquiry.findMany({
          where: { buyerId: currentUserId },
          include: {
            property: {
              select: { id: true, title: true, price: true, imageUrl: true, location: true, availabilityStatus: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const myViewingRequests: ViewingRequestWithProperty[] =
    role === "BUYER"
      ? await prisma.viewingRequest.findMany({
          where: { buyerId: currentUserId },
          include: {
            property: {
              select: { id: true, title: true, price: true, imageUrl: true, location: true, availabilityStatus: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const totalEnquiriesOnMyListings = myProperties.reduce((sum, p) => sum + p.enquiries.length, 0);
  const totalViewingRequestsOnMyListings = myProperties.reduce((sum, p) => sum + p.viewingRequests.length, 0);
  const totalViewsOnMyListings = myProperties.reduce((sum, p) => sum + p.views, 0);
  const totalSavedOnMyListings = myProperties.reduce((sum, p) => sum + p._count.savedBy, 0);

  return (
    <div className="min-h-screen bg-[var(--dk-ivory)] font-sans text-[var(--dk-ink)]">
      <div className="max-w-[1120px] mx-auto px-5 py-8 pb-16 flex flex-col gap-6">
        {/* Header */}
        <header className="bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-2xl p-6 md:p-7 md:flex-row flex flex-col gap-4 shadow-[0_1px_3px_var(--dk-shadow)] md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dk-muted)] m-0">Dashboard</p>
            <h1 className="[font-family:var(--font-display)] text-2xl font-semibold mt-1 leading-tight text-[var(--dk-heading)]">Welcome back, {session.user.name || session.user.email} 👋</h1>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard href="#my-listings" chip="green" icon={<IconHouse />} label="My Properties" value={myProperties.length} />
            <StatCard href="#my-listings" chip="blue" icon={<IconPeople />} label="Enquiries" value={totalEnquiriesOnMyListings} />
            <StatCard href="#my-listings" chip="purple" icon={<IconCalendar />} label="Viewing Requests" value={totalViewingRequestsOnMyListings} />
            <StatCard href="#my-listings" chip="amber" icon={<IconEye />} label="Profile Views" value={totalViewsOnMyListings} />
            <StatCard href="#my-listings" chip="purple" icon={<IconHeart />} label="Saved by buyers" value={totalSavedOnMyListings} />
            <StatCard href="#notifications" chip="amber" icon={<IconMail />} label="Notifications" value={receivedNotifications.length} />
          </div>
        )}
        {role === "ADMIN" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard href="#pending-listings" chip="amber" icon={<IconHouse />} label="Pending Listings" value={pendingProperties.length} />
            <StatCard href="#pending-enquiries" chip="blue" icon={<IconMail />} label="Pending Enquiries" value={pendingEnquiries.length} />
            <StatCard href="#pending-viewing-requests" chip="purple" icon={<IconCalendar />} label="Pending Viewing Requests" value={pendingViewingRequests.length} />
            <StatCard href="#all-listings" chip="green" icon={<IconEye />} label="Total Listings" value={allProperties.length} />
            <StatCard href="#manage-users" chip="purple" icon={<IconPeople />} label="Total Users" value={allUsers.length} />
            <StatCard href="#notifications" chip="amber" icon={<IconMail />} label="Notifications" value={receivedNotifications.length} />
          </div>
        )}
        {role === "BUYER" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard href="#saved-properties" chip="purple" icon={<IconHeart />} label="Favorites" value={savedProperties.length} />
            <StatCard href="#my-enquiries" chip="blue" icon={<IconMail />} label="Enquiries Sent" value={myEnquiries.length} />
            <StatCard href="#my-viewing-requests" chip="purple" icon={<IconCalendar />} label="Viewing Requests" value={myViewingRequests.length} />
            <StatCard href="#notifications" chip="amber" icon={<IconEye />} label="Notifications" value={receivedNotifications.length} />
          </div>
        )}

        {/* Account profile */}
        <Section eyebrow="Account" title="Profile">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex items-start gap-4 md:w-64 flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-[var(--dk-dark)] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                {(currentUser.name || currentUser.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[var(--dk-heading)] leading-tight break-words m-0">
                  {currentUser.name || "No name set"}
                </p>
                <p className="text-sm text-[var(--dk-muted)] break-words mt-0.5 m-0">{currentUser.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge label={getRoleLabel(role) || role} tone="role" />
                  {currentUser.emailVerified ? (
                    <Badge label="Email verified" tone="success" />
                  ) : (
                    <Badge label="Email not verified" tone="warning" />
                  )}
                  {(role === "OWNER" || role === "AGENT") &&
                    (currentUser.verified ? (
                      <Badge label="Verified account" tone="success" />
                    ) : (
                      <Badge label="Not verified" tone="neutral" />
                    ))}
                </div>
                <p className="text-xs text-[var(--dk-muted)] mt-2 m-0">
                  Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1 md:pt-0 md:border-l md:border-[var(--dk-border)] md:pl-8">
              <ProfileNameForm currentName={currentUser.name} />
            </div>
          </div>
        </Section>

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
                <p className="text-sm text-[var(--dk-muted)] m-0">You haven&apos;t listed any properties yet.</p>
              ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
                  {myProperties.map((p) => {
                    return (
                      <li key={p.id} className="bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl p-4.5 md:p-5 transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)]">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-lg font-bold text-[var(--dk-heading)]">{p.title}</strong>
                          <Badge label={p.status.replace("_", " ")} tone={statusTone(p.status)} />
                          <Badge label={getAvailabilityLabel(p.availabilityStatus)} tone={availabilityTone(p.availabilityStatus)} />
                          {p.verified ? (
                            <Badge label="Verified" tone="success" />
                          ) : (
                            <Badge label="Not verified" tone="neutral" />
                          )}
                          {p.featured && <Badge label="Featured" tone="accent" />}
                        </div>

                        <div className="mt-2 text-lg font-bold text-[var(--dk-heading)]">KSh {p.price.toLocaleString()}</div>

                        {p.representingName && (
                          <div className="mt-1.5 text-sm text-[var(--dk-muted)]">
                            Representing: {p.representingName}
                            {p.representingContact && <> ({p.representingContact})</>}
                          </div>
                        )}

                        <div className="mt-3">
                          <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                        </div>

                        <div className="mt-3 text-xs text-[var(--dk-muted)]">
                          {p.views} views · {p._count.savedBy} saved · {p.enquiries.length} enquir
                          {p.enquiries.length === 1 ? "y" : "ies"} · {p.viewingRequests.length} viewing request
                          {p.viewingRequests.length === 1 ? "" : "s"}
                        </div>

                        {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                          <div className="mt-3 bg-[var(--dk-gold-bg)] border border-[var(--dk-gold)] text-[var(--dk-gold-deep)] rounded-xl px-3.5 py-2 text-sm italic">
                            Admin note: {p.adminNote}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2.5">
                          {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                            <Link href={`/properties/${p.id}/edit`} className="inline-flex items-center justify-center font-sans text-sm font-semibold text-[var(--dk-heading)] bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl px-4.5 py-2 hover:bg-[var(--dk-ivory)] hover:border-[var(--dk-border-hover)] no-underline transition-colors duration-150">
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link href={`/properties/${p.id}/documents`} className="inline-flex items-center justify-center font-sans text-sm font-semibold text-[var(--dk-heading)] bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl px-4.5 py-2 hover:bg-[var(--dk-ivory)] hover:border-[var(--dk-border-hover)] no-underline transition-colors duration-150">
                            Manage documents
                          </Link>
                        </div>

                        {p.enquiries.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[var(--dk-border)]">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)] m-0 mb-2">Enquiries</p>
                            <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                              {p.enquiries.map((e: Enquiry & { buyer: Pick<User, "name" | "email"> }) => (
                                <li key={e.id} className="text-sm text-[var(--dk-muted)]">
                                  <strong className="text-[var(--dk-heading)]">{e.buyer.name || e.buyer.email}</strong>: {e.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {p.viewingRequests.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[var(--dk-border)]">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)] m-0 mb-2">Viewing requests</p>
                            <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                              {p.viewingRequests.map((v: ViewingRequest & { buyer: Pick<User, "name" | "email"> }) => (
                                <li key={v.id} className="text-sm text-[var(--dk-muted)]">
                                  <strong className="text-[var(--dk-heading)]">{v.buyer.name || v.buyer.email}</strong> wants to view on{" "}
                                  {new Date(v.preferredDate).toLocaleString()}
                                  {v.message && <> — {v.message}</>}
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

            <Section id="pending-viewing-requests" eyebrow={`${pendingViewingRequests.length} pending`} title="Viewing requests awaiting review">
              <ViewingRequestApprovalList viewingRequests={pendingViewingRequests} />
            </Section>

            <Section id="all-listings" eyebrow={`${allProperties.length} total`} title="All listings">
              <div className="flex flex-col gap-4 pb-5 border-b border-[var(--dk-border)] mb-5 md:flex-row md:flex-wrap md:items-end md:justify-between">
                <FilterForm>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">Filter by status</label>
                    <select name="status" defaultValue={searchParams.status || ""} className="font-sans text-sm text-[var(--dk-heading)] bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl px-3.5 py-2 outline-none focus:shadow-[0_0_0_2px_var(--dk-card),0_0_0_4px_var(--dk-primary)]">
                      <option value="">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="CHANGES_REQUESTED">Changes requested</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center font-sans text-sm font-semibold text-white bg-[var(--dk-primary)] border border-[var(--dk-primary)] rounded-xl px-4.5 py-2 cursor-pointer no-underline transition-colors duration-150 hover:bg-[var(--dk-primary-hover)]">
                    Filter
                  </button>
                </FilterForm>

                <FilterForm>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">Search by seller name or phone</label>
                    <input
                      type="text"
                      name="q"
                      defaultValue={searchParams.q}
                      placeholder="e.g. Jane or 0712..."
                      className="font-sans text-sm text-[var(--dk-heading)] bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl px-3.5 py-2 w-auto md:w-55 outline-none focus:shadow-[0_0_0_2px_var(--dk-card),0_0_0_4px_var(--dk-primary)]"
                    />
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center font-sans text-sm font-semibold text-white bg-[var(--dk-primary)] border border-[var(--dk-primary)] rounded-xl px-4.5 py-2 cursor-pointer no-underline transition-colors duration-150 hover:bg-[var(--dk-primary-hover)]">
                    Search
                  </button>
                </FilterForm>

                <a href="/dashboard" className="text-sm font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)] hover:underline no-underline">
                  Clear filters
                </a>
              </div>

              <div className="mt-1">
                <AdminPropertyList properties={allProperties} />
              </div>
            </Section>

            <Section id="manage-users" eyebrow={`${allUsers.length} total`} title="Manage users">
              <div className="flex flex-col gap-4 pb-5 border-b border-[var(--dk-border)] mb-5 md:flex-row md:flex-wrap md:items-end md:justify-between">
                <FilterForm>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">Filter by role</label>
                    <select name="userRole" defaultValue={searchParams.userRole || ""} className="font-sans text-sm text-[var(--dk-heading)] bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl px-3.5 py-2 outline-none focus:shadow-[0_0_0_2px_var(--dk-card),0_0_0_4px_var(--dk-primary)]">
                      <option value="">All</option>
                      <option value="BUYER">{ROLE_LABELS.BUYER}</option>
                      <option value="OWNER">{ROLE_LABELS.OWNER}</option>
                      <option value="AGENT">{ROLE_LABELS.AGENT}</option>
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    </select>
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center font-sans text-sm font-semibold text-white bg-[var(--dk-primary)] border border-[var(--dk-primary)] rounded-xl px-4.5 py-2 cursor-pointer no-underline transition-colors duration-150 hover:bg-[var(--dk-primary-hover)]">
                    Filter
                  </button>
                </FilterForm>

                <FilterForm>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">Search by name, email, or phone</label>
                    <input
                      type="text"
                      name="userQ"
                      defaultValue={searchParams.userQ}
                      placeholder="e.g. Jane, jane@example.com, or 0712..."
                      className="font-sans text-sm text-[var(--dk-heading)] bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl px-3.5 py-2 w-auto md:w-55 outline-none focus:shadow-[0_0_0_2px_var(--dk-card),0_0_0_4px_var(--dk-primary)]"
                    />
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center font-sans text-sm font-semibold text-white bg-[var(--dk-primary)] border border-[var(--dk-primary)] rounded-xl px-4.5 py-2 cursor-pointer no-underline transition-colors duration-150 hover:bg-[var(--dk-primary-hover)]">
                    Search
                  </button>
                </FilterForm>

                <a href="/dashboard" className="text-sm font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)] hover:underline no-underline">
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
              <p className="text-sm leading-6 text-[var(--dk-muted)] mt-3">
                Browse properties on the{" "}
                <Link href="/" className="text-sm font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)] hover:underline no-underline">
                  homepage
                </Link>
                .
              </p>
            </Section>

            <Section id="saved-properties" eyebrow={`${savedProperties.length} saved`} title="Your favorites">
              {savedProperties.length === 0 ? (
                <p className="text-sm text-[var(--dk-muted)] m-0">
                  You haven&apos;t favorited any properties yet. Browse the{" "}
                  <Link href="/" className="font-semibold text-[var(--dk-primary)] hover:text-[var(--dk-primary-hover)] hover:underline no-underline">
                    homepage
                  </Link>{" "}
                  and tap &quot;Save property&quot; on any listing to add it here.
                </p>
              ) : (
                <ul className="list-none m-0 p-0 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {savedProperties.map((s) => {
                    const p = s.property;
                    const noLongerPublic = p.status !== "APPROVED";
                    return (
                      <li
                        key={s.id}
                        className="bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl overflow-hidden transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)]"
                      >
                        <Link href={`/properties/${p.id}`} className="block relative">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.title} className="w-full h-36 object-cover" />
                          ) : (
                            <div className="w-full h-36 bg-[var(--dk-ivory)] flex items-center justify-center text-xs text-[var(--dk-muted)]">
                              No photo
                            </div>
                          )}
                          <span className="absolute top-2 left-2">
                            <Badge label={getAvailabilityLabel(p.availabilityStatus)} tone={availabilityTone(p.availabilityStatus)} />
                          </span>
                        </Link>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/properties/${p.id}`} className="font-bold text-[var(--dk-heading)] hover:text-[var(--dk-primary)] no-underline leading-snug">
                              {p.title}
                            </Link>
                          </div>

                          <div className="mt-1 text-sm font-semibold text-[var(--dk-heading)]">KSh {p.price.toLocaleString()}</div>

                          <div className="mt-1 text-xs text-[var(--dk-muted)]">
                            {p.location} — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)} —{" "}
                            {p.listingType === "SALE" ? "For sale" : "For rent"}
                          </div>

                          <div className="mt-1 text-xs text-[var(--dk-muted)]">
                            Listed by {p.seller.name || p.seller.email}
                          </div>

                          {noLongerPublic && (
                            <div className="mt-2 text-xs italic text-[var(--dk-gold-deep)]">
                              This listing is no longer public ({p.status.replace("_", " ").toLowerCase()}).
                            </div>
                          )}

                          <div className="mt-3">
                            <SaveButton propertyId={p.id} initiallySaved={true} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>

            <Section id="my-enquiries" eyebrow={`${myEnquiries.length} sent`} title="Your enquiries">
              {myEnquiries.length === 0 ? (
                <p className="text-sm text-[var(--dk-muted)] m-0">You haven&apos;t sent any enquiries yet.</p>
              ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
                  {myEnquiries.map((e: EnquiryWithProperty) => {
                    const { label, tone } = enquiryStatusLabelAndTone(e.status);
                    return (
                      <li
                        key={e.id}
                        className="bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl p-4.5 md:p-5 transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)] flex gap-4"
                      >
                        {e.property.imageUrl ? (
                          <img
                            src={e.property.imageUrl}
                            alt={e.property.title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-[var(--dk-ivory)] flex-shrink-0 flex items-center justify-center text-[10px] text-[var(--dk-muted)]">
                            No photo
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <Link href={`/properties/${e.property.id}`} className="text-lg font-bold text-[var(--dk-heading)] hover:text-[var(--dk-primary)] no-underline block">
                              {e.property.title}
                            </Link>
                            <span className="text-sm font-semibold text-[var(--dk-heading)] whitespace-nowrap">
                              KSh {e.property.price.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-xs text-[var(--dk-muted)] mt-0.5">{e.property.location}</div>

                          <div className="text-sm text-[var(--dk-muted)] mt-2">{e.message}</div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge label={label} tone={tone} />
                            <Badge label={getAvailabilityLabel(e.property.availabilityStatus)} tone={availabilityTone(e.property.availabilityStatus)} />
                            <span className="text-xs text-[var(--dk-muted)]">
                              Sent {new Date(e.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>

            <Section id="my-viewing-requests" eyebrow={`${myViewingRequests.length} sent`} title="Your viewing requests">
              {myViewingRequests.length === 0 ? (
                <p className="text-sm text-[var(--dk-muted)] m-0">You haven&apos;t requested any viewings yet.</p>
              ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
                  {myViewingRequests.map((v: ViewingRequestWithProperty) => {
                    const { label, tone } = viewingRequestStatusLabelAndTone(v.status);
                    return (
                      <li
                        key={v.id}
                        className="bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl p-4.5 md:p-5 transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)] flex gap-4"
                      >
                        {v.property.imageUrl ? (
                          <img
                            src={v.property.imageUrl}
                            alt={v.property.title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-[var(--dk-ivory)] flex-shrink-0 flex items-center justify-center text-[10px] text-[var(--dk-muted)]">
                            No photo
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <Link href={`/properties/${v.property.id}`} className="text-lg font-bold text-[var(--dk-heading)] hover:text-[var(--dk-primary)] no-underline block">
                              {v.property.title}
                            </Link>
                            <span className="text-sm font-semibold text-[var(--dk-heading)] whitespace-nowrap">
                              KSh {v.property.price.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-xs text-[var(--dk-muted)] mt-0.5">{v.property.location}</div>

                          <div className="text-sm text-[var(--dk-muted)] mt-2">
                            Requested viewing on <strong className="text-[var(--dk-heading)]">{new Date(v.preferredDate).toLocaleString()}</strong>
                          </div>

                          {v.message && <div className="text-sm text-[var(--dk-muted)] mt-1">{v.message}</div>}

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge label={label} tone={tone} />
                            <Badge label={getAvailabilityLabel(v.property.availabilityStatus)} tone={availabilityTone(v.property.availabilityStatus)} />
                            <span className="text-xs text-[var(--dk-muted)]">
                              Sent {new Date(v.createdAt).toLocaleDateString()}
                            </span>
                          </div>
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
            <p className="text-sm text-[var(--dk-muted)] m-0">No notifications yet.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
              {receivedNotifications.map((n) => (
                <li key={n.id} className="bg-[var(--dk-card)] border border-[var(--dk-border)] rounded-xl p-3.5 md:p-4 transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)]">
                  {n.propertyId ? (
                    <Link href={`/properties/${n.propertyId}`} className="text-sm font-semibold text-[var(--dk-heading)] hover:text-[var(--dk-primary)] no-underline">
                      {n.message}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-[var(--dk-heading)]">{n.message}</span>
                  )}
                  <div className="text-xs text-[var(--dk-muted)] mt-1.5 block">
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