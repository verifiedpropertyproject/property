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
// Design: a surveyor's-plaque palette — deep pine header, warm parchment
// page, brass accent for anything verified/approved. All styling below is
// plain CSS injected once via <DashboardStyles/>, so it renders correctly
// whether or not this project has Tailwind configured.
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
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dtb-section">
      <div className="dtb-section-head">
        <p className="dtb-eyebrow">{eyebrow}</p>
        <h2 className="dtb-title">{title}</h2>
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

  return (
    <div className="dtb-page">
      <DashboardStyles />
      <div className="dtb-container">
        {/* Header — styled like a brass nameplate */}
        <header className="dtb-header">
          <div>
            <p className="dtb-eyebrow dtb-eyebrow--onDark">Dashboard</p>
            <h1 className="dtb-name">{session.user.name || session.user.email}</h1>
            <div className="dtb-badge-row">
              <Badge label={getRoleLabel(role) || role} tone="role" />
              {(role === "OWNER" || role === "AGENT") && currentUser.verified && (
                <Badge label="Verified account" tone="accent" />
              )}
            </div>
          </div>
          <div className="dtb-header-actions">
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
                            <Link href={`/properties/${p.id}/edit`} className="dtb-link">
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link href={`/properties/${p.id}/documents`} className="dtb-link">
                            Manage supporting documents
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
            <Section eyebrow={`${pendingProperties.length} pending`} title="Listings awaiting review">
              <PropertyApprovalList properties={pendingProperties} />
            </Section>

            <Section eyebrow={`${pendingEnquiries.length} pending`} title="Enquiries awaiting review">
              <EnquiryApprovalList enquiries={pendingEnquiries} />
            </Section>

            <Section eyebrow={`${allProperties.length} total`} title="All listings">
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

            <Section eyebrow={`${allUsers.length} total`} title="Manage users">
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

            <Section eyebrow={`${savedProperties.length} saved`} title="Your saved properties">
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

            <Section eyebrow={`${myEnquiries.length} sent`} title="Your enquiries">
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
        <Section eyebrow={`${receivedNotifications.length} total`} title="Notifications">
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
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

      .dtb-page {
        min-height: 100vh;
        background: #EEF0EB;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #14231F;
      }
      .dtb-page--centered {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .dtb-container {
        max-width: 1080px;
        margin: 0 auto;
        padding: 40px 20px 64px;
        display: flex;
        flex-direction: column;
        gap: 28px;
      }

      .dtb-center-card {
        width: 100%;
        max-width: 440px;
        background: #FBFAF5;
        border: 1px solid #DCD8CC;
        border-radius: 24px;
        padding: 32px;
        text-align: center;
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
        background: #14231F;
        color: #F5F2E8;
        border-radius: 24px;
        padding: 28px 32px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .dtb-header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .dtb-name {
        font-family: 'Fraunces', serif;
        font-size: 1.9rem;
        font-weight: 600;
        margin: 4px 0 0;
        line-height: 1.15;
      }
      .dtb-badge-row {
        margin-top: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .dtb-eyebrow {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: #8A6A2E;
        margin: 0;
      }
      .dtb-eyebrow--onDark { color: #C9A65E; }
      .dtb-eyebrow--danger { color: #B4482D; }

      .dtb-title {
        font-family: 'Fraunces', serif;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 4px 0 0;
        color: #14231F;
      }
      .dtb-title--lg { font-size: 1.9rem; }

      .dtb-copy {
        font-size: 0.95rem;
        line-height: 1.6;
        color: #5B5647;
        margin: 12px 0 0;
      }
      .dtb-copy:first-of-type { margin-top: 12px; }

      .dtb-section {
        background: #FBFAF5;
        border: 1px solid #DCD8CC;
        border-radius: 24px;
        padding: 28px;
      }
      .dtb-section-head { margin-bottom: 20px; }

      .dtb-empty {
        font-size: 0.9rem;
        color: #5B5647;
        margin: 0;
      }

      .dtb-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        border: 1px solid transparent;
        padding: 3px 11px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.65rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        line-height: 1.7;
      }
      .dtb-badge--role { background: #14231F; color: #F5F2E8; border-color: #14231F; }
      .dtb-badge--success { background: #EAF3EE; color: #1F6F5C; border-color: #BFDBCE; }
      .dtb-badge--warning { background: #FBF2E1; color: #8A6A2E; border-color: #E9D4A4; }
      .dtb-badge--danger { background: #FBEAE6; color: #B4482D; border-color: #F0C4B8; }
      .dtb-badge--accent { background: #F6E9CF; color: #8A6A2E; border-color: #E4C88F; }
      .dtb-badge--neutral { background: #EEECE3; color: #5B5647; border-color: #DCD8CC; }

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
        border: 1px solid #DCD8CC;
        border-radius: 18px;
        padding: 20px;
        transition: border-color 0.15s ease;
      }
      .dtb-card:hover { border-color: #C9A65E; }
      .dtb-card--tight { padding: 16px 20px; }

      .dtb-card-tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .dtb-card-title {
        font-family: 'Fraunces', serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #14231F;
      }
      .dtb-card-title--link { text-decoration: none; display: block; }
      .dtb-card-title--link:hover { color: #8A6A2E; }

      .dtb-price {
        margin-top: 8px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 1.1rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: #14231F;
      }

      .dtb-muted { font-size: 0.88rem; color: #5B5647; margin-top: 6px; }
      .dtb-strong { color: #14231F; }

      .dtb-availability { margin-top: 12px; }

      .dtb-meta {
        margin-top: 12px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #8A8371;
      }
      .dtb-meta--block { margin-top: 6px; text-transform: none; letter-spacing: 0; }

      .dtb-note {
        margin-top: 12px;
        background: #FBF2E1;
        border: 1px solid #E9D4A4;
        color: #8A6A2E;
        border-radius: 12px;
        padding: 8px 14px;
        font-size: 0.88rem;
        font-style: italic;
      }

      .dtb-actions {
        margin-top: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
      }

      .dtb-link {
        font-size: 0.88rem;
        font-weight: 500;
        color: #8A6A2E;
        text-decoration: underline;
        text-decoration-color: #E4C88F;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }
      .dtb-link:hover { color: #6B5220; }

      .dtb-subblock {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #EEECE3;
      }
      .dtb-subhead {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: #8A6A2E;
        margin: 0 0 8px;
      }
      .dtb-sublist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }

      .dtb-filters {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-bottom: 24px;
        border-bottom: 1px solid #EEECE3;
        margin-bottom: 24px;
      }
      .dtb-form { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
      .dtb-field { display: flex; flex-direction: column; gap: 5px; }
      .dtb-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #8A8371;
      }
      .dtb-input, .dtb-select {
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        color: #14231F;
        background: #FFFFFF;
        border: 1px solid #DCD8CC;
        border-radius: 999px;
        padding: 8px 16px;
        outline: none;
      }
      .dtb-input--wide { width: 220px; }
      .dtb-input:focus-visible, .dtb-select:focus-visible, .dtb-button:focus-visible, a.dtb-link:focus-visible {
        box-shadow: 0 0 0 2px #FBFAF5, 0 0 0 4px #8A6A2E;
      }
      .dtb-button {
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        color: #F5F2E8;
        background: #14231F;
        border: none;
        border-radius: 999px;
        padding: 9px 22px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .dtb-button:hover { background: #22362F; }

      .dtb-embed { margin-top: 4px; }

      .dtb-row {
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: #FFFFFF;
        border: 1px solid #DCD8CC;
        border-radius: 16px;
        padding: 14px 18px;
      }
      .dtb-row-title { font-weight: 500; color: #14231F; text-decoration: none; }
      .dtb-row-title:hover { color: #8A6A2E; }
      .dtb-row-price {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.88rem;
        font-variant-numeric: tabular-nums;
        color: #5B5647;
        white-space: nowrap;
      }

      .dtb-notification-message {
        font-size: 0.92rem;
        font-weight: 500;
        color: #14231F;
        text-decoration: none;
      }
      a.dtb-notification-message:hover { color: #8A6A2E; }

      @media (min-width: 640px) {
        .dtb-header { flex-direction: row; align-items: center; justify-content: space-between; padding: 32px 40px; }
        .dtb-filters { flex-direction: row; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; }
      }

      @media (prefers-reduced-motion: reduce) {
        * { transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}
