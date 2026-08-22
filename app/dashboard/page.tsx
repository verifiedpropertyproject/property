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
// Design: DAKTOP360's own brand — deep forest green, white cards, pastel
// icon chips, pill badges. Plain CSS injected once via <DashboardStyles/>,
// so it renders the same regardless of what CSS tooling this project uses.
// ---------------------------------------------------------------------------
type Tone = "role" | "success" | "warning" | "danger" | "accent" | "neutral";

function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <span className={`dtb-badge dtb-badge--${tone}`}>{label}</span>;
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
    <section id={id} className="dtb-section">
      <div className="dtb-section-head">
        <div>
          <p className="dtb-eyebrow">{eyebrow}</p>
          <h2 className="dtb-title">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function FilterForm({ children }: { children: React.ReactNode }) {
  return (
    <form method="get" className="dtb-form">
      {children}
    </form>
  );
}

// --- tiny inline icons (no external icon package required) -----------------
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
  return (
    <div className="dtb-stat">
      <div className="dtb-stat-top">
        <span className={`dtb-stat-icon dtb-stat-icon--${chip}`}>{icon}</span>
        <span className="dtb-stat-label">{label}</span>
      </div>
      <div className="dtb-stat-value">{value}</div>
      <Link href={href} className="dtb-stat-link">
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
      <div className="dtb-page dtb-page--centered">
        <DashboardStyles />
        <div className="dtb-center-card">
          <p className="dtb-eyebrow dtb-eyebrow--danger">Account status</p>
          <h1 className="dtb-title dtb-title--lg">Account suspended</h1>
          <p className="dtb-copy">
            Your account has been suspended. Contact support if you believe this is a mistake.
          </p>
          <div className="dtb-center-actions">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    return (
      <div className="dtb-page dtb-page--centered">
        <DashboardStyles />
        <div className="dtb-center-card">
          <p className="dtb-eyebrow">One step left</p>
          <h1 className="dtb-title dtb-title--lg">Verify your email</h1>
          <p className="dtb-copy">
            Please verify your email address (<strong>{currentUser.email}</strong>) before using
            your dashboard.
          </p>
          <p className="dtb-copy">
            If you registered with email/password, you should have seen a verification link right
            after signing up. If you didn&apos;t click it (or it expired), generate a new one
            below.
          </p>
          <div className="dtb-center-actions">
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

  // Derived stat totals for the stat-card row
  const totalEnquiriesOnMyListings = myProperties.reduce((sum, p) => sum + p.enquiries.length, 0);
  const totalViewsOnMyListings = myProperties.reduce((sum, p) => sum + p.views, 0);
  const totalSavedOnMyListings = myProperties.reduce((sum, p) => sum + p._count.savedBy, 0);

  return (
    <div className="dtb-page">
      <DashboardStyles />
      <div className="dtb-container">
        {/* Header */}
        <header className="dtb-header">
          <div>
            <p className="dtb-eyebrow">Dashboard</p>
            <h1 className="dtb-name">Welcome back, {session.user.name || session.user.email} 👋</h1>
            <div className="dtb-badge-row">
              <Badge label={getRoleLabel(role) || role} tone="role" />
              {(role === "OWNER" || role === "AGENT") && currentUser.verified && (
                <Badge label="Verified account" tone="success" />
              )}
            </div>
          </div>
          <div className="dtb-header-actions">
            <NotificationBell />
            <SignOutButton />
          </div>
        </header>

        {/* Stat row */}
        {(role === "OWNER" || role === "AGENT") && (
          <div className="dtb-stats">
            <StatCard href="#my-listings" chip="green" icon={<IconHouse />} label="My Properties" value={myProperties.length} />
            <StatCard href="#my-listings" chip="blue" icon={<IconPeople />} label="Enquiries" value={totalEnquiriesOnMyListings} />
            <StatCard href="#my-listings" chip="amber" icon={<IconEye />} label="Profile Views" value={totalViewsOnMyListings} />
            <StatCard href="#my-listings" chip="purple" icon={<IconHeart />} label="Saved by buyers" value={totalSavedOnMyListings} />
          </div>
        )}
        {role === "ADMIN" && (
          <div className="dtb-stats">
            <StatCard href="#pending-listings" chip="amber" icon={<IconHouse />} label="Pending Listings" value={pendingProperties.length} />
            <StatCard href="#pending-enquiries" chip="blue" icon={<IconMail />} label="Pending Enquiries" value={pendingEnquiries.length} />
            <StatCard href="#all-listings" chip="green" icon={<IconEye />} label="Total Listings" value={allProperties.length} />
            <StatCard href="#manage-users" chip="purple" icon={<IconPeople />} label="Total Users" value={allUsers.length} />
          </div>
        )}
        {role === "BUYER" && (
          <div className="dtb-stats">
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
          <>
            <Section eyebrow="New listing" title="List a property">
              <PropertyForm isAgent={role === "AGENT"} />
            </Section>

            <Section id="my-listings" eyebrow={`${myProperties.length} total`} title="Your listings">
              {myProperties.length === 0 ? (
                <p className="dtb-empty">You haven&apos;t listed any properties yet.</p>
              ) : (
                <ul className="dtb-list">
                  {myProperties.map((p) => {
                    return (
                      <li key={p.id} className="dtb-card">
                        <div className="dtb-card-tags">
                          <strong className="dtb-card-title">{p.title}</strong>
                          <Badge label={p.status.replace("_", " ")} tone={statusTone(p.status)} />
                          {p.verified ? (
                            <Badge label="Verified" tone="success" />
                          ) : (
                            <Badge label="Not verified" tone="neutral" />
                          )}
                          {p.featured && <Badge label="Featured" tone="accent" />}
                        </div>

                        <div className="dtb-price">KSh {p.price.toLocaleString()}</div>

                        {p.representingName && (
                          <div className="dtb-muted">
                            Representing: {p.representingName}
                            {p.representingContact && <> ({p.representingContact})</>}
                          </div>
                        )}

                        <div className="dtb-availability">
                          <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                        </div>

                        <div className="dtb-meta">
                          {p.views} views · {p._count.savedBy} saved · {p.enquiries.length} enquir
                          {p.enquiries.length === 1 ? "y" : "ies"}
                        </div>

                        {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                          <div className="dtb-note">Admin note: {p.adminNote}</div>
                        )}

                        <div className="dtb-actions">
                          {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                            <Link href={`/properties/${p.id}/edit`} className="dtb-button dtb-button--outline">
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link href={`/properties/${p.id}/documents`} className="dtb-button dtb-button--outline">
                            Manage documents
                          </Link>
                        </div>

                        {p.enquiries.length > 0 && (
                          <div className="dtb-subblock">
                            <p className="dtb-subhead">Enquiries</p>
                            <ul className="dtb-sublist">
                              {p.enquiries.map((e: Enquiry & { buyer: Pick<User, "name" | "email"> }) => (
                                <li key={e.id} className="dtb-muted">
                                  <strong className="dtb-strong">{e.buyer.name || e.buyer.email}</strong>: {e.message}
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
              <div className="dtb-filters">
                <FilterForm>
                  <div className="dtb-field">
                    <label className="dtb-label">Filter by status</label>
                    <select name="status" defaultValue={searchParams.status || ""} className="dtb-select">
                      <option value="">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="CHANGES_REQUESTED">Changes requested</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <button type="submit" className="dtb-button">
                    Filter
                  </button>
                </FilterForm>

                <FilterForm>
                  <div className="dtb-field">
                    <label className="dtb-label">Search by seller name or phone</label>
                    <input
                      type="text"
                      name="q"
                      defaultValue={searchParams.q}
                      placeholder="e.g. Jane or 0712..."
                      className="dtb-input dtb-input--wide"
                    />
                  </div>
                  <button type="submit" className="dtb-button">
                    Search
                  </button>
                </FilterForm>

                <a href="/dashboard" className="dtb-link">
                  Clear filters
                </a>
              </div>

              <div className="dtb-embed">
                <AdminPropertyList properties={allProperties} />
              </div>
            </Section>

            <Section id="manage-users" eyebrow={`${allUsers.length} total`} title="Manage users">
              <div className="dtb-filters">
                <FilterForm>
                  <div className="dtb-field">
                    <label className="dtb-label">Filter by role</label>
                    <select name="userRole" defaultValue={searchParams.userRole || ""} className="dtb-select">
                      <option value="">All</option>
                      <option value="BUYER">{ROLE_LABELS.BUYER}</option>
                      <option value="OWNER">{ROLE_LABELS.OWNER}</option>
                      <option value="AGENT">{ROLE_LABELS.AGENT}</option>
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    </select>
                  </div>
                  <button type="submit" className="dtb-button">
                    Filter
                  </button>
                </FilterForm>

                <FilterForm>
                  <div className="dtb-field">
                    <label className="dtb-label">Search by name, email, or phone</label>
                    <input
                      type="text"
                      name="userQ"
                      defaultValue={searchParams.userQ}
                      placeholder="e.g. Jane, jane@example.com, or 0712..."
                      className="dtb-input dtb-input--wide"
                    />
                  </div>
                  <button type="submit" className="dtb-button">
                    Search
                  </button>
                </FilterForm>

                <a href="/dashboard" className="dtb-link">
                  Clear filters
                </a>
              </div>

              <div className="dtb-embed">
                <AdminUserList users={allUsers} currentUserId={currentUserId} />
              </div>
            </Section>
          </>
        )}

        {role === "BUYER" && (
          <>
            <Section eyebrow="Explore" title="Browse properties">
              <p className="dtb-copy">
                Browse properties on the{" "}
                <Link href="/" className="dtb-link">
                  homepage
                </Link>
                .
              </p>
            </Section>

            <Section id="saved-properties" eyebrow={`${savedProperties.length} saved`} title="Your saved properties">
              {savedProperties.length === 0 ? (
                <p className="dtb-empty">You haven&apos;t saved any properties yet.</p>
              ) : (
                <ul className="dtb-list">
                  {savedProperties.map((s) => (
                    <li key={s.id} className="dtb-row">
                      <Link href={`/properties/${s.property.id}`} className="dtb-row-title">
                        {s.property.title}
                      </Link>
                      <span className="dtb-row-price">KSh {s.property.price.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section id="my-enquiries" eyebrow={`${myEnquiries.length} sent`} title="Your enquiries">
              {myEnquiries.length === 0 ? (
                <p className="dtb-empty">You haven&apos;t sent any enquiries yet.</p>
              ) : (
                <ul className="dtb-list">
                  {myEnquiries.map((e: EnquiryWithProperty) => {
                    const { label, tone } = enquiryStatusLabelAndTone(e.status);
                    return (
                      <li key={e.id} className="dtb-card">
                        <Link href={`/properties/${e.property.id}`} className="dtb-card-title dtb-card-title--link">
                          {e.property.title}
                        </Link>
                        <div className="dtb-muted">{e.message}</div>
                        <div className="dtb-badge-row">
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
            <p className="dtb-empty">No notifications yet.</p>
          ) : (
            <ul className="dtb-list">
              {receivedNotifications.map((n) => (
                <li key={n.id} className="dtb-card dtb-card--tight">
                  {n.propertyId ? (
                    <Link href={`/properties/${n.propertyId}`} className="dtb-notification-message">
                      {n.message}
                    </Link>
                  ) : (
                    <span className="dtb-notification-message">{n.message}</span>
                  )}
                  <div className="dtb-meta dtb-meta--block">
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

// ---------------------------------------------------------------------------
// All styling lives here as plain CSS, injected once. This makes the page
// render consistently no matter what CSS tooling (or lack of it) the host
// project uses.
// ---------------------------------------------------------------------------
function DashboardStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      * { box-sizing: border-box; }

      .dtb-page {
        min-height: 100vh;
        background: #F4F6F5;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #17251E;
      }
      .dtb-page--centered {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .dtb-container {
        max-width: 1120px;
        margin: 0 auto;
        padding: 32px 20px 64px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .dtb-center-card {
        width: 100%;
        max-width: 440px;
        background: #FFFFFF;
        border: 1px solid #E7EBE8;
        border-radius: 16px;
        padding: 32px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(15,61,43,0.06);
      }
      .dtb-center-actions {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .dtb-header {
        background: #FFFFFF;
        border: 1px solid #E7EBE8;
        border-radius: 16px;
        padding: 24px 28px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: 0 1px 3px rgba(15,61,43,0.05);
      }
      .dtb-header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .dtb-name {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 4px 0 0;
        line-height: 1.25;
        color: #14231F;
      }
      .dtb-badge-row {
        margin-top: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .dtb-eyebrow {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6B7A72;
        margin: 0;
      }
      .dtb-eyebrow--danger { color: #C0392B; }

      .dtb-title {
        font-size: 1.15rem;
        font-weight: 700;
        margin: 2px 0 0;
        color: #14231F;
      }
      .dtb-title--lg { font-size: 1.6rem; }

      .dtb-copy {
        font-size: 0.92rem;
        line-height: 1.6;
        color: #566B60;
        margin: 12px 0 0;
      }
      .dtb-copy:first-of-type { margin-top: 12px; }

      /* Stat cards */
      .dtb-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .dtb-stat {
        background: #FFFFFF;
        border: 1px solid #E7EBE8;
        border-radius: 16px;
        padding: 18px 20px;
        box-shadow: 0 1px 3px rgba(15,61,43,0.05);
      }
      .dtb-stat-top {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dtb-stat-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .dtb-stat-icon svg { width: 18px; height: 18px; }
      .dtb-stat-icon--green { background: #E4F5E9; color: #17843C; }
      .dtb-stat-icon--blue { background: #E5EEFB; color: #2563AE; }
      .dtb-stat-icon--amber { background: #FCF0DC; color: #B4770E; }
      .dtb-stat-icon--purple { background: #EFE7FA; color: #7C4EC4; }
      .dtb-stat-label { font-size: 0.85rem; font-weight: 500; color: #566B60; }
      .dtb-stat-value {
        margin-top: 10px;
        font-size: 1.9rem;
        font-weight: 700;
        color: #14231F;
        line-height: 1;
      }
      .dtb-stat-link {
        display: inline-block;
        margin-top: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        color: #17843C;
        text-decoration: none;
      }
      .dtb-stat-link:hover { color: #0F5D2A; }

      .dtb-section {
        background: #FFFFFF;
        border: 1px solid #E7EBE8;
        border-radius: 16px;
        padding: 24px 28px;
        box-shadow: 0 1px 3px rgba(15,61,43,0.05);
      }
      .dtb-section-head {
        margin-bottom: 18px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .dtb-empty {
        font-size: 0.9rem;
        color: #566B60;
        margin: 0;
      }

      .dtb-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        border: 1px solid transparent;
        padding: 3px 12px;
        font-size: 0.72rem;
        font-weight: 600;
        line-height: 1.7;
      }
      .dtb-badge--role { background: #123B2B; color: #FFFFFF; }
      .dtb-badge--success { background: #E4F5E9; color: #17843C; }
      .dtb-badge--warning { background: #FCF0DC; color: #B4770E; }
      .dtb-badge--danger { background: #FBE7E5; color: #C0392B; }
      .dtb-badge--accent { background: #E4F5E9; color: #17843C; }
      .dtb-badge--neutral { background: #EEF1EF; color: #5B6660; }

      .dtb-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .dtb-card {
        background: #FFFFFF;
        border: 1px solid #E7EBE8;
        border-radius: 14px;
        padding: 18px 20px;
        transition: box-shadow 0.15s ease, border-color 0.15s ease;
      }
      .dtb-card:hover { border-color: #C7DECF; box-shadow: 0 2px 8px rgba(15,61,43,0.06); }
      .dtb-card--tight { padding: 14px 20px; }

      .dtb-card-tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .dtb-card-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #14231F;
      }
      .dtb-card-title--link { text-decoration: none; display: block; }
      .dtb-card-title--link:hover { color: #17843C; }

      .dtb-price {
        margin-top: 8px;
        font-size: 1.15rem;
        font-weight: 700;
        color: #123B2B;
      }

      .dtb-muted { font-size: 0.87rem; color: #566B60; margin-top: 6px; }
      .dtb-strong { color: #14231F; }

      .dtb-availability { margin-top: 12px; }

      .dtb-meta {
        margin-top: 12px;
        font-size: 0.78rem;
        color: #7C8A82;
      }
      .dtb-meta--block { margin-top: 6px; }

      .dtb-note {
        margin-top: 12px;
        background: #FCF0DC;
        border: 1px solid #F2DDAE;
        color: #8A6A2E;
        border-radius: 10px;
        padding: 8px 14px;
        font-size: 0.87rem;
        font-style: italic;
      }

      .dtb-actions {
        margin-top: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .dtb-link {
        font-size: 0.87rem;
        font-weight: 600;
        color: #17843C;
        text-decoration: none;
      }
      .dtb-link:hover { color: #0F5D2A; text-decoration: underline; }

      .dtb-subblock {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #EEF1EF;
      }
      .dtb-subhead {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6B7A72;
        margin: 0 0 8px;
      }
      .dtb-sublist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }

      .dtb-filters {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-bottom: 20px;
        border-bottom: 1px solid #EEF1EF;
        margin-bottom: 20px;
      }
      .dtb-form { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
      .dtb-field { display: flex; flex-direction: column; gap: 5px; }
      .dtb-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #7C8A82;
      }
      .dtb-input, .dtb-select {
        font-family: 'Inter', sans-serif;
        font-size: 0.88rem;
        color: #14231F;
        background: #FFFFFF;
        border: 1px solid #DAE1DD;
        border-radius: 10px;
        padding: 8px 14px;
        outline: none;
      }
      .dtb-input--wide { width: 220px; }
      .dtb-input:focus-visible, .dtb-select:focus-visible, .dtb-button:focus-visible, a.dtb-link:focus-visible {
        box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #17843C;
      }
      .dtb-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', sans-serif;
        font-size: 0.86rem;
        font-weight: 600;
        color: #FFFFFF;
        background: #123B2B;
        border: 1px solid #123B2B;
        border-radius: 10px;
        padding: 8px 18px;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.15s ease;
      }
      .dtb-button:hover { background: #0D2B1F; }
      .dtb-button--outline {
        background: #FFFFFF;
        color: #123B2B;
        border: 1px solid #DAE1DD;
      }
      .dtb-button--outline:hover { background: #F4F6F5; border-color: #C7DECF; }

      .dtb-embed { margin-top: 4px; }

      .dtb-row {
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: #FFFFFF;
        border: 1px solid #E7EBE8;
        border-radius: 12px;
        padding: 12px 16px;
      }
      .dtb-row-title { font-weight: 600; color: #14231F; text-decoration: none; }
      .dtb-row-title:hover { color: #17843C; }
      .dtb-row-price {
        font-size: 0.87rem;
        font-weight: 600;
        color: #566B60;
        white-space: nowrap;
      }

      .dtb-notification-message {
        font-size: 0.92rem;
        font-weight: 600;
        color: #14231F;
        text-decoration: none;
      }
      a.dtb-notification-message:hover { color: #17843C; }

      @media (min-width: 640px) {
        .dtb-header { flex-direction: row; align-items: center; justify-content: space-between; padding: 28px 32px; }
        .dtb-filters { flex-direction: row; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; }
      }

      @media (prefers-reduced-motion: reduce) {
        * { transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}
