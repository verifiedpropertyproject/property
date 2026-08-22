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

// ---------------------------------------------------------------------------
// Design tokens — a surveyor's-plaque palette: deep pine ink, warm parchment,
// and a brass accent for anything "verified" or "approved". Status reads as
// stamped signage rather than generic pill colors.
// ---------------------------------------------------------------------------
type Tone = "role" | "success" | "warning" | "danger" | "accent" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  role: "bg-[#14231F] text-[#F5F2E8] border-[#14231F]",
  success: "bg-[#EAF3EE] text-[#1F6F5C] border-[#BFDBCE]",
  warning: "bg-[#FBF2E1] text-[#8A6A2E] border-[#E9D4A4]",
  danger: "bg-[#FBEAE6] text-[#B4482D] border-[#F0C4B8]",
  accent: "bg-[#F6E9CF] text-[#8A6A2E] border-[#E4C88F]",
  neutral: "bg-[#EEECE3] text-[#5B5647] border-[#DCD8CC]",
};

function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wider ${TONE_STYLES[tone]}`}
    >
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

// ---------------------------------------------------------------------------
// Shared layout primitives
// ---------------------------------------------------------------------------
function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#DCD8CC] bg-[#FBFAF5] p-6 shadow-[0_1px_0_rgba(20,35,31,0.04)] sm:p-8">
      <div className="mb-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[#8A6A2E]">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-serif text-2xl text-[#14231F]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FilterForm({
  action,
  children,
}: {
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      {children}
    </form>
  );
}

const fieldClasses =
  "rounded-full border border-[#DCD8CC] bg-white px-4 py-2 text-sm text-[#14231F] outline-none transition focus-visible:ring-2 focus-visible:ring-[#8A6A2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFAF5]";

const buttonClasses =
  "rounded-full bg-[#14231F] px-5 py-2 text-sm font-medium text-[#F5F2E8] transition hover:bg-[#22362F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6A2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFAF5]";

const linkClasses = "text-sm font-medium text-[#8A6A2E] underline decoration-[#E4C88F] decoration-2 underline-offset-4 hover:text-[#6B5220]";

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
      <div
        className="flex min-h-screen items-center justify-center bg-[#EEF0EB] px-6"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <FontImport />
        <div className="w-full max-w-md rounded-3xl border border-[#DCD8CC] bg-[#FBFAF5] p-8 text-center shadow-sm">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[#B4482D]">
            Account status
          </p>
          <h1 className="mt-2 font-serif text-2xl text-[#14231F]">Account suspended</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5B5647]">
            Your account has been suspended. Contact support if you believe this is a mistake.
          </p>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#EEF0EB] px-6"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <FontImport />
        <div className="w-full max-w-md rounded-3xl border border-[#DCD8CC] bg-[#FBFAF5] p-8 text-center shadow-sm">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[#8A6A2E]">
            One step left
          </p>
          <h1 className="mt-2 font-serif text-2xl text-[#14231F]">Verify your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5B5647]">
            Please verify your email address (<strong className="text-[#14231F]">{currentUser.email}</strong>)
            before using your dashboard.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#5B5647]">
            If you registered with email/password, you should have seen a verification link right
            after signing up. If you didn&apos;t click it (or it expired), generate a new one below.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
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
          select: { id: true, name: true, email: true, phone: true, role: true, suspended: true, verified: true },
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

  return (
    <div className="min-h-screen bg-[#EEF0EB]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <FontImport />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        {/* Header — styled like a brass nameplate */}
        <header className="flex flex-col gap-4 rounded-3xl bg-[#14231F] p-6 text-[#F5F2E8] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[#C9A65E]">
              Dashboard
            </p>
            <h1 className="mt-1 font-serif text-3xl">
              {session.user.name || session.user.email}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge label={getRoleLabel(role) || role} tone="role" />
              {(role === "OWNER" || role === "AGENT") && currentUser.verified && (
                <Badge label="Verified account" tone="accent" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <SignOutButton />
          </div>
        </header>

        {/* Phone number */}
        <Section eyebrow="Contact" title="Phone number">
          <PhoneForm currentPhone={currentUser.phone} />
        </Section>

        {(role === "OWNER" || role === "AGENT") && (
          <>
            <Section eyebrow="New listing" title="List a property">
              <PropertyForm isAgent={role === "AGENT"} />
            </Section>

            <Section eyebrow={`${myProperties.length} total`} title="Your listings">
              {myProperties.length === 0 ? (
                <p className="text-sm text-[#5B5647]">You haven&apos;t listed any properties yet.</p>
              ) : (
                <ul className="space-y-4">
                  {myProperties.map((p) => {
                    return (
                      <li
                        key={p.id}
                        className="rounded-2xl border border-[#DCD8CC] bg-white p-5 transition hover:border-[#C9A65E]/60"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="font-serif text-lg text-[#14231F]">{p.title}</strong>
                          <Badge label={p.status.replace("_", " ")} tone={statusTone(p.status)} />
                          {p.verified ? (
                            <Badge label="Verified" tone="success" />
                          ) : (
                            <Badge label="Not verified" tone="neutral" />
                          )}
                          {p.featured && <Badge label="Featured" tone="accent" />}
                        </div>

                        <div className="mt-2 font-mono text-lg font-medium tabular-nums text-[#14231F]">
                          KSh {p.price.toLocaleString()}
                        </div>

                        {p.representingName && (
                          <div className="mt-1 text-sm text-[#5B5647]">
                            Representing: {p.representingName}
                            {p.representingContact && <> ({p.representingContact})</>}
                          </div>
                        )}

                        <div className="mt-3">
                          <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                        </div>

                        <div className="mt-3 font-mono text-xs uppercase tracking-wide text-[#8A8371]">
                          {p.views} views · {p._count.savedBy} saved · {p.enquiries.length} enquir
                          {p.enquiries.length === 1 ? "y" : "ies"}
                        </div>

                        {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                          <div className="mt-3 rounded-xl border border-[#E9D4A4] bg-[#FBF2E1] px-3 py-2 text-sm italic text-[#8A6A2E]">
                            Admin note: {p.adminNote}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4">
                          {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                            <Link href={`/properties/${p.id}/edit`} className={linkClasses}>
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link href={`/properties/${p.id}/documents`} className={linkClasses}>
                            Manage supporting documents
                          </Link>
                        </div>

                        {p.enquiries.length > 0 && (
                          <div className="mt-4 border-t border-[#EEECE3] pt-4">
                            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#8A6A2E]">
                              Enquiries
                            </p>
                            <ul className="mt-2 space-y-2">
                              {p.enquiries.map((e: Enquiry & { buyer: Pick<User, "name" | "email"> }) => (
                                <li key={e.id} className="text-sm text-[#5B5647]">
                                  <strong className="text-[#14231F]">{e.buyer.name || e.buyer.email}</strong>:{" "}
                                  {e.message}
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
            <Section eyebrow={`${pendingProperties.length} pending`} title="Listings awaiting review">
              <PropertyApprovalList properties={pendingProperties} />
            </Section>

            <Section eyebrow={`${pendingEnquiries.length} pending`} title="Enquiries awaiting review">
              <EnquiryApprovalList enquiries={pendingEnquiries} />
            </Section>

            <Section eyebrow={`${allProperties.length} total`} title="All listings">
              <div className="flex flex-col gap-3 border-b border-[#EEECE3] pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <FilterForm>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[0.65rem] uppercase tracking-wide text-[#8A8371]">
                      Filter by status
                    </label>
                    <select name="status" defaultValue={searchParams.status || ""} className={fieldClasses}>
                      <option value="">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="CHANGES_REQUESTED">Changes requested</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <button type="submit" className={buttonClasses}>
                    Filter
                  </button>
                </FilterForm>

                <FilterForm>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[0.65rem] uppercase tracking-wide text-[#8A8371]">
                      Search by seller name or phone
                    </label>
                    <input
                      type="text"
                      name="q"
                      defaultValue={searchParams.q}
                      placeholder="e.g. Jane or 0712..."
                      className={`${fieldClasses} w-56`}
                    />
                  </div>
                  <button type="submit" className={buttonClasses}>
                    Search
                  </button>
                </FilterForm>

                <a href="/dashboard" className={linkClasses}>
                  Clear filters
                </a>
              </div>

              <div className="mt-6">
                <AdminPropertyList properties={allProperties} />
              </div>
            </Section>

            <Section eyebrow={`${allUsers.length} total`} title="Manage users">
              <div className="flex flex-col gap-3 border-b border-[#EEECE3] pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <FilterForm>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[0.65rem] uppercase tracking-wide text-[#8A8371]">
                      Filter by role
                    </label>
                    <select name="userRole" defaultValue={searchParams.userRole || ""} className={fieldClasses}>
                      <option value="">All</option>
                      <option value="BUYER">{ROLE_LABELS.BUYER}</option>
                      <option value="OWNER">{ROLE_LABELS.OWNER}</option>
                      <option value="AGENT">{ROLE_LABELS.AGENT}</option>
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    </select>
                  </div>
                  <button type="submit" className={buttonClasses}>
                    Filter
                  </button>
                </FilterForm>

                <FilterForm>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[0.65rem] uppercase tracking-wide text-[#8A8371]">
                      Search by name, email, or phone
                    </label>
                    <input
                      type="text"
                      name="userQ"
                      defaultValue={searchParams.userQ}
                      placeholder="e.g. Jane, jane@example.com, or 0712..."
                      className={`${fieldClasses} w-64`}
                    />
                  </div>
                  <button type="submit" className={buttonClasses}>
                    Search
                  </button>
                </FilterForm>

                <a href="/dashboard" className={linkClasses}>
                  Clear filters
                </a>
              </div>

              <div className="mt-6">
                <AdminUserList users={allUsers} currentUserId={currentUserId} />
              </div>
            </Section>
          </>
        )}

        {role === "BUYER" && (
          <>
            <Section eyebrow="Explore" title="Browse properties">
              <p className="text-sm text-[#5B5647]">
                Browse properties on the{" "}
                <Link href="/" className={linkClasses}>
                  homepage
                </Link>
                .
              </p>
            </Section>

            <Section eyebrow={`${savedProperties.length} saved`} title="Your saved properties">
              {savedProperties.length === 0 ? (
                <p className="text-sm text-[#5B5647]">You haven&apos;t saved any properties yet.</p>
              ) : (
                <ul className="space-y-2">
                  {savedProperties.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-2xl border border-[#DCD8CC] bg-white px-4 py-3"
                    >
                      <Link href={`/properties/${s.property.id}`} className="font-medium text-[#14231F] hover:text-[#8A6A2E]">
                        {s.property.title}
                      </Link>
                      <span className="font-mono text-sm tabular-nums text-[#5B5647]">
                        KSh {s.property.price.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section eyebrow={`${myEnquiries.length} sent`} title="Your enquiries">
              {myEnquiries.length === 0 ? (
                <p className="text-sm text-[#5B5647]">You haven&apos;t sent any enquiries yet.</p>
              ) : (
                <ul className="space-y-3">
                  {myEnquiries.map((e: EnquiryWithProperty) => {
                    const { label, tone } = enquiryStatusLabelAndTone(e.status);
                    return (
                      <li key={e.id} className="rounded-2xl border border-[#DCD8CC] bg-white p-4">
                        <Link
                          href={`/properties/${e.property.id}`}
                          className="font-serif text-base text-[#14231F] hover:text-[#8A6A2E]"
                        >
                          {e.property.title}
                        </Link>
                        <div className="mt-1 text-sm text-[#5B5647]">{e.message}</div>
                        <div className="mt-2">
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
        <Section eyebrow={`${receivedNotifications.length} total`} title="Notifications">
          {receivedNotifications.length === 0 ? (
            <p className="text-sm text-[#5B5647]">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {receivedNotifications.map((n) => (
                <li key={n.id} className="rounded-2xl border border-[#DCD8CC] bg-white p-4">
                  {n.propertyId ? (
                    <Link href={`/properties/${n.propertyId}`} className="text-sm font-medium text-[#14231F] hover:text-[#8A6A2E]">
                      {n.message}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-[#14231F]">{n.message}</span>
                  )}
                  <div className="mt-1">
                    <small className="font-mono text-xs text-[#8A8371]">
                      From {n.sender.name || n.sender.email} — {new Date(n.createdAt).toLocaleString()}
                    </small>
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

// ---------------------------------------------------------------------------
// One-time font import (display serif for headings, mono for data/eyebrows).
// Inline so the whole page stays a single file.
// ---------------------------------------------------------------------------
function FontImport() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      .font-serif { font-family: 'Fraunces', serif; }
      .font-mono { font-family: 'IBM Plex Mono', monospace; }
      @media (prefers-reduced-motion: reduce) {
        * { transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}
