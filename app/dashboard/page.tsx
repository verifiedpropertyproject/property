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

// --- Color palette (matches the Daktop360 reference design) ---
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
  red: "#DC2626",
  yellow: "#F59E0B",
};

const badgeStyle = (variant: string = "default"): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  };

  const variants: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: COLORS.border,
      color: COLORS.textGray,
    },
    primary: {
      backgroundColor: COLORS.primaryGreen,
      color: COLORS.white,
    },
    dark: {
      backgroundColor: COLORS.darkGreen,
      color: COLORS.white,
    },
    light: {
      backgroundColor: COLORS.lightGreenBg,
      color: COLORS.primaryGreen,
    },
    warning: {
      backgroundColor: COLORS.yellow,
      color: COLORS.white,
    },
    danger: {
      backgroundColor: COLORS.red,
      color: COLORS.white,
    },
    success: {
      backgroundColor: COLORS.primaryGreen,
      color: COLORS.white,
    },
  };

  return { ...base, ...variants[variant] };
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  padding: "clamp(16px, 2.5vw, 24px)",
  marginBottom: "24px",
};

const sectionTitleStyle: React.CSSProperties = {
  color: COLORS.darkGreen,
  fontSize: "clamp(18px, 2vw, 22px)",
  marginTop: 0,
  marginBottom: "16px",
};

const fieldWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 500,
  fontSize: "13px",
};

const fieldInputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  boxSizing: "border-box",
  fontSize: "14px",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  backgroundColor: COLORS.white,
};

const buttonPrimaryStyle: React.CSSProperties = {
  backgroundColor: COLORS.primaryGreen,
  color: COLORS.white,
  border: "none",
  borderRadius: "8px",
  padding: "10px 20px",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  transition: "background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease",
};

const linkStyle: React.CSSProperties = {
  color: COLORS.primaryGreen,
  textDecoration: "none",
  fontWeight: 500,
  transition: "color 0.2s ease",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
  padding: "16px",
  transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
};

function Badge({ label, variant = "default" }: { label: string; variant?: string }) {
  return <span style={badgeStyle(variant)}>{label}</span>;
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
      <div style={{ backgroundColor: COLORS.pageBg, minHeight: "100vh", padding: "40px 20px" }}>
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: COLORS.red, marginBottom: "16px" }}>Account suspended</h1>
          <p style={{ color: COLORS.textGray, marginBottom: "24px" }}>
            Your account has been suspended. Contact support if you believe this is a mistake.
          </p>
          <div>
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    return (
      <div style={{ backgroundColor: COLORS.pageBg, minHeight: "100vh", padding: "40px 20px" }}>
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "40px",
          }}
        >
          <h1 style={{ color: COLORS.darkGreen, marginBottom: "16px" }}>Verify your email</h1>
          <p style={{ color: COLORS.textGray, marginBottom: "12px" }}>
            Please verify your email address (<strong>{currentUser.email}</strong>) before using your dashboard.
          </p>
          <p style={{ color: COLORS.textGray, marginBottom: "24px" }}>
            If you registered with email/password, you should have seen a verification link right
            after signing up. If you didn&apos;t click it (or it expired), generate a new one below.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
    <div style={{ backgroundColor: COLORS.pageBg, minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dk-section {
          animation: fadeInUp 0.4s ease both;
        }

        .dk-input:focus, .dk-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }

        .dk-btn-primary:hover {
          background-color: ${COLORS.primaryGreenHover} !important;
          box-shadow: 0 4px 12px rgba(31,122,76,0.35);
        }
        .dk-btn-primary:active {
          transform: scale(0.97);
        }

        .dk-link:hover {
          color: ${COLORS.primaryGreenHover};
          text-decoration: underline;
        }

        .dk-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(11,46,31,0.1);
          border-color: ${COLORS.primaryGreen}55;
        }

        .dk-list-item {
          transition: background-color 0.2s ease;
        }
        .dk-list-item:hover {
          background-color: ${COLORS.sectionBg};
        }

        @media (max-width: 640px) {
          .dk-dashboard-header {
            flex-direction: column;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .dk-dashboard-actions {
            flex-wrap: wrap;
          }
          .dk-filter-row {
            flex-direction: column;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 40px)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: COLORS.textDark,
        }}
      >
        {/* Header */}
        <header
          className="dk-dashboard-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
            padding: "clamp(16px, 2.5vw, 24px)",
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
          }}
        >
          <div>
            <h1 style={{ color: COLORS.darkGreen, margin: 0, fontSize: "clamp(22px, 3vw, 28px)" }}>
              Dashboard
            </h1>
            <p style={{ color: COLORS.textGray, margin: "6px 0 0 0" }}>
              Logged in as <strong style={{ color: COLORS.textDark }}>{session.user.name || session.user.email}</strong>{" "}
              <Badge label={role} variant="primary" />
              {(role === "OWNER" || role === "AGENT") && currentUser.verified && (
                <span style={{ marginLeft: "6px" }}>
                  <Badge label="VERIFIED ACCOUNT" variant="success" />
                </span>
              )}
            </p>
          </div>
          <div className="dk-dashboard-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NotificationBell />
            <SignOutButton />
          </div>
        </header>

        {/* Phone number section */}
        <section className="dk-section" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Phone number</h2>
          <PhoneForm currentPhone={currentUser.phone} />
        </section>

        {/* Owner/Agent sections */}
        {(role === "OWNER" || role === "AGENT") && (
          <>
            <section className="dk-section" style={sectionStyle}>
              <h2 style={sectionTitleStyle}>List a property</h2>
              <PropertyForm isAgent={role === "AGENT"} />
            </section>

            <section className="dk-section" style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Your listings</h2>
              {myProperties.length === 0 ? (
                <p style={{ color: COLORS.textGray }}>You haven&apos;t listed any properties yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                  {myProperties.map((p) => {
                    const statusVariant = 
                      p.status === "APPROVED" ? "success" :
                      p.status === "PENDING" ? "warning" :
                      p.status === "REJECTED" ? "danger" :
                      "default";
                    return (
                      <li key={p.id} className="dk-card" style={cardStyle}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "16px", color: COLORS.textDark }}>{p.title}</strong>
                          <Badge label={p.status.replace("_", " ")} variant={statusVariant} />
                          {p.verified ? (
                            <Badge label="VERIFIED" variant="success" />
                          ) : (
                            <Badge label="NOT VERIFIED" variant="default" />
                          )}
                          {p.featured && <Badge label="FEATURED" variant="dark" />}
                        </div>
                        <div style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "17px", marginBottom: "4px" }}>
                          KSh {p.price.toLocaleString()}
                        </div>
                        {p.representingName && (
                          <div style={{ color: COLORS.textGray, fontSize: "14px", marginBottom: "4px" }}>
                            Representing: {p.representingName}
                            {p.representingContact && <> ({p.representingContact})</>}
                          </div>
                        )}
                        <div style={{ marginBottom: "8px" }}>
                          <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                        </div>
                        <div style={{ color: COLORS.textGray, fontSize: "14px", marginBottom: "8px" }}>
                          {p.views} views — {p._count.savedBy} saved — {p.enquiries.length} enquir
                          {p.enquiries.length === 1 ? "y" : "ies"}
                        </div>
                        {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                          <div style={{ 
                            backgroundColor: COLORS.lightGreenBg, 
                            padding: "8px 12px", 
                            borderRadius: "6px", 
                            marginBottom: "8px",
                            fontSize: "14px",
                            color: COLORS.textDark,
                          }}>
                            <em>Admin note: {p.adminNote}</em>
                          </div>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                          {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                            <Link 
                              href={`/properties/${p.id}/edit`}
                              style={linkStyle}
                              className="dk-link"
                            >
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link 
                            href={`/properties/${p.id}/documents`}
                            style={linkStyle}
                            className="dk-link"
                          >
                            Manage supporting documents
                          </Link>
                        </div>
                        {p.enquiries.length > 0 && (
                          <div style={{ marginTop: "12px", borderTop: `1px solid ${COLORS.border}`, paddingTop: "12px" }}>
                            <em style={{ color: COLORS.textGray, fontSize: "14px" }}>Enquiries:</em>
                            <ul style={{ listStyle: "none", padding: "8px 0 0 0", margin: 0 }}>
                              {p.enquiries.map((e: Enquiry & { buyer: Pick<User, "name" | "email"> }) => (
                                <li key={e.id} style={{ 
                                  padding: "6px 0", 
                                  borderBottom: `1px solid ${COLORS.border}`,
                                  fontSize: "14px",
                                  color: COLORS.textDark,
                                }}>
                                  <strong>{e.buyer.name || e.buyer.email}</strong>: {e.message}
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
            </section>
          </>
        )}

        {/* Admin sections */}
        {role === "ADMIN" && (
          <>
            <section className="dk-section" style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Listings awaiting review</h2>
              <PropertyApprovalList properties={pendingProperties} />
            </section>

            <section className="dk-section" style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Enquiries awaiting review</h2>
              <EnquiryApprovalList enquiries={pendingEnquiries} />
            </section>

            <section className="dk-section" style={sectionStyle}>
              <h2 style={sectionTitleStyle}>All listings</h2>

              <div className="dk-filter-row" style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
                <form method="get" style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
                  <div style={fieldWrapperStyle}>
                    <label style={fieldLabelStyle}>Filter by status</label>
                    <select
                      name="status"
                      defaultValue={searchParams.status || ""}
                      className="dk-input"
                      style={fieldInputStyle}
                    >
                      <option value="">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="CHANGES_REQUESTED">Changes requested</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <button type="submit" className="dk-btn-primary" style={buttonPrimaryStyle}>
                    Filter
                  </button>
                </form>

                <form method="get" style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
                  <div style={fieldWrapperStyle}>
                    <label style={fieldLabelStyle}>Search by seller name or phone</label>
                    <input
                      type="text"
                      name="q"
                      defaultValue={searchParams.q}
                      placeholder="e.g. Jane or 0712..."
                      className="dk-input"
                      style={fieldInputStyle}
                    />
                  </div>
                  <button type="submit" className="dk-btn-primary" style={buttonPrimaryStyle}>
                    Search
                  </button>
                </form>

                <a href="/dashboard" className="dk-link" style={{ ...linkStyle, alignSelf: "center" }}>
                  Clear filters
                </a>
              </div>

              <div>
                <AdminPropertyList properties={allProperties} />
              </div>
            </section>

            <section className="dk-section" style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Manage users</h2>

              <div className="dk-filter-row" style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
                <form method="get" style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
                  <div style={fieldWrapperStyle}>
                    <label style={fieldLabelStyle}>Filter by role</label>
                    <select
                      name="userRole"
                      defaultValue={searchParams.userRole || ""}
                      className="dk-input"
                      style={fieldInputStyle}
                    >
                      <option value="">All</option>
                      <option value="BUYER">{ROLE_LABELS.BUYER}</option>
                      <option value="OWNER">{ROLE_LABELS.OWNER}</option>
                      <option value="AGENT">{ROLE_LABELS.AGENT}</option>
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    </select>
                  </div>
                  <button type="submit" className="dk-btn-primary" style={buttonPrimaryStyle}>
                    Filter
                  </button>
                </form>

                <form method="get" style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
                  <div style={fieldWrapperStyle}>
                    <label style={fieldLabelStyle}>Search by name, email, or phone</label>
                    <input
                      type="text"
                      name="userQ"
                      defaultValue={searchParams.userQ}
                      placeholder="e.g. Jane, jane@example.com, or 0712..."
                      className="dk-input"
                      style={fieldInputStyle}
                    />
                  </div>
                  <button type="submit" className="dk-btn-primary" style={buttonPrimaryStyle}>
                    Search
                  </button>
                </form>

                <a href="/dashboard" className="dk-link" style={{ ...linkStyle, alignSelf: "center" }}>
                  Clear filters
                </a>
              </div>

              <div>
                <AdminUserList users={allUsers} currentUserId={currentUserId} />
              </div>
            </section>
          </>
        )}

        {/* Buyer sections */}
        {role === "BUYER" && (
          <>
            <section className="dk-section" style={sectionStyle}>
              <p style={{ color: COLORS.textGray }}>
                Browse properties on the{" "}
                <Link href="/" style={linkStyle} className="dk-link">
                  homepage
                </Link>
                .
              </p>
            </section>

            <section className="dk-section" style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Your saved properties</h2>
              {savedProperties.length === 0 ? (
                <p style={{ color: COLORS.textGray }}>You haven&apos;t saved any properties yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {savedProperties.map((s) => (
                    <li key={s.id} className="dk-list-item" style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      transition: "background-color 0.2s ease",
                    }}>
                      <Link 
                        href={`/properties/${s.property.id}`}
                        style={{ ...linkStyle, fontWeight: 600 }}
                        className="dk-link"
                      >
                        {s.property.title}
                      </Link>{" "}
                      <span style={{ color: COLORS.primaryGreen, fontWeight: 600 }}>
                        — KSh {s.property.price.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dk-section" style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Your enquiries</h2>
              {myEnquiries.length === 0 ? (
                <p style={{ color: COLORS.textGray }}>You haven&apos;t sent any enquiries yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {myEnquiries.map((e: EnquiryWithProperty) => {
                    const statusLabel =
                      e.status === "PENDING"
                        ? "Awaiting admin review"
                        : e.status === "APPROVED"
                          ? "Sent to seller"
                          : "Not approved";
                    const statusVariant = 
                      e.status === "APPROVED" ? "success" :
                      e.status === "PENDING" ? "warning" :
                      "danger";
                    return (
                      <li key={e.id} className="dk-list-item" style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: `1px solid ${COLORS.border}`,
                        transition: "background-color 0.2s ease",
                      }}>
                        <Link 
                          href={`/properties/${e.property.id}`}
                          style={{ ...linkStyle, fontWeight: 600 }}
                          className="dk-link"
                        >
                          {e.property.title}
                        </Link>
                        <div style={{ color: COLORS.textGray, fontSize: "14px", marginTop: "4px" }}>{e.message}</div>
                        <div style={{ marginTop: "6px" }}>
                          <Badge label={statusLabel} variant={statusVariant} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        {/* Notifications section - always visible */}
        <section className="dk-section" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Notifications</h2>
          {receivedNotifications.length === 0 ? (
            <p style={{ color: COLORS.textGray }}>No notifications yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {receivedNotifications.map((n) => (
                <li key={n.id} className="dk-list-item" style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  transition: "background-color 0.2s ease",
                }}>
                  {n.propertyId ? (
                    <Link 
                      href={`/properties/${n.propertyId}`}
                      style={{ ...linkStyle, fontWeight: 500 }}
                      className="dk-link"
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <span style={{ color: COLORS.textDark }}>{n.message}</span>
                  )}
                  <div style={{ marginTop: "4px" }}>
                    <small style={{ color: COLORS.textGray }}>
                      From {n.sender.name || n.sender.email} — {new Date(n.createdAt).toLocaleString()}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}