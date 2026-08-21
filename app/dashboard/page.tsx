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

// --- Color palette (matches the Daktop360 reference design / homepage) ---
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
  amberBg: "#FEF3C7",
  amberText: "#92400E",
  redBg: "#FEE2E2",
  redText: "#991B1B",
};

const fieldWrapperStyle: React.CSSProperties = {
  flex: "1 1 220px",
  minWidth: "180px",
  display: "flex",
  flexDirection: "column",
};

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 500,
  fontSize: "13px",
  marginBottom: "6px",
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
};

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.sectionBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  padding: "clamp(16px, 3vw, 24px)",
  marginBottom: "24px",
};

const sectionHeadingStyle: React.CSSProperties = {
  color: COLORS.darkGreen,
  marginTop: 0,
  marginBottom: "16px",
  fontSize: "18px",
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: COLORS.primaryGreen,
  color: COLORS.white,
  border: "none",
  borderRadius: "8px",
  padding: "10px 22px",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
};

const BADGE_TONES: Record<string, { bg: string; color: string }> = {
  neutral: { bg: COLORS.lightGreenBg, color: COLORS.primaryGreen },
  success: { bg: COLORS.lightGreenBg, color: COLORS.primaryGreen },
  dark: { bg: COLORS.darkGreen, color: COLORS.white },
  warning: { bg: COLORS.amberBg, color: COLORS.amberText },
  danger: { bg: COLORS.redBg, color: COLORS.redText },
  outline: { bg: COLORS.white, color: COLORS.textGray },
};

function toneForLabel(label: string): keyof typeof BADGE_TONES {
  const l = label.toUpperCase();
  if (l.includes("FEATURED")) return "dark";
  if (l.includes("VERIFIED") && !l.includes("NOT")) return "success";
  if (l.includes("NOT VERIFIED")) return "outline";
  if (l.includes("REJECTED") || l.includes("NOT APPROVED")) return "danger";
  if (l.includes("PENDING") || l.includes("CHANGES") || l.includes("AWAITING")) return "warning";
  if (l.includes("APPROVED") || l.includes("SENT")) return "success";
  return "neutral";
}

function Badge({ label }: { label: string }) {
  const tone = BADGE_TONES[toneForLabel(label)];
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: tone.bg,
        color: tone.color,
        fontSize: "11px",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: "4px",
        letterSpacing: "0.02em",
        marginLeft: "6px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

const globalStyles = `
  * { box-sizing: border-box; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .dk-hero { animation: fadeIn 0.5s ease both; }

  .dk-card {
    animation: fadeInUp 0.45s ease both;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .dk-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(11,46,31,0.10);
    border-color: ${COLORS.primaryGreen}55;
  }

  .dk-title {
    transition: color 0.2s ease;
  }
  .dk-title:hover {
    color: ${COLORS.primaryGreen};
  }

  .dk-btn {
    transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  }
  .dk-btn:hover {
    background-color: ${COLORS.primaryGreenHover};
    box-shadow: 0 4px 12px rgba(31,122,76,0.35);
  }
  .dk-btn:active {
    transform: scale(0.97);
  }

  .dk-link {
    color: ${COLORS.primaryGreen};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .dk-link:hover {
    color: ${COLORS.primaryGreenHover};
    text-decoration: underline;
  }

  .dk-input:focus, .dk-input:focus-visible {
    outline: none;
    border-color: ${COLORS.primaryGreen} !important;
    box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
  }

  .dk-clear-link {
    color: ${COLORS.primaryGreen};
    font-weight: 500;
    text-decoration: none;
    transition: opacity 0.2s ease;
  }
  .dk-clear-link:hover {
    opacity: 0.7;
  }

  .dk-filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 14px;
  }

  @media (max-width: 640px) {
    .dk-header-row {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 12px;
    }
  }
`;

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
      <div style={{ backgroundColor: COLORS.pageBg, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            maxWidth: "480px",
            width: "100%",
            margin: "40px auto",
            padding: "clamp(24px, 4vw, 32px)",
            backgroundColor: COLORS.sectionBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginBottom: "10px" }}>Account suspended</h1>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>
            Your account has been suspended. Contact support if you believe this is a mistake.
          </p>
          <div style={{ marginTop: "18px" }}>
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    return (
      <div style={{ backgroundColor: COLORS.pageBg, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            maxWidth: "520px",
            width: "100%",
            margin: "40px auto",
            padding: "clamp(24px, 4vw, 32px)",
            backgroundColor: COLORS.sectionBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginBottom: "10px" }}>Verify your email</h1>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>
            Please verify your email address ({currentUser.email}) before using your dashboard.
          </p>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>
            If you registered with email/password, you should have seen a verification link right
            after signing up. If you didn&apos;t click it (or it expired), generate a new one below.
          </p>
          <div style={{ marginTop: "18px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
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
    <div style={{ backgroundColor: COLORS.pageBg, overflowX: "hidden" }}>
      <div
        style={{
          color: COLORS.textDark,
          fontFamily: "system-ui, -apple-system, sans-serif",
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
        <style>{globalStyles}</style>

        {/* ---------- Header ---------- */}
        <header
          className="dk-hero dk-header-row"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1
              style={{
                color: COLORS.darkGreen,
                marginBottom: "8px",
                fontSize: "clamp(22px, 3vw, 28px)",
                lineHeight: 1.25,
              }}
            >
              Dashboard
            </h1>
            <p style={{ color: COLORS.textGray, margin: 0 }}>
              Logged in as <strong style={{ color: COLORS.textDark }}>{session.user.name || session.user.email}</strong>
              <Badge label={role} />
              {(role === "OWNER" || role === "AGENT") && currentUser.verified && <Badge label="VERIFIED ACCOUNT" />}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <NotificationBell />
            <SignOutButton />
          </div>
        </header>

        <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "0 0 28px" }} />

        {/* ---------- Phone number ---------- */}
        <section style={sectionCardStyle}>
          <h2 style={sectionHeadingStyle}>Phone number</h2>
          <PhoneForm currentPhone={currentUser.phone} />
        </section>

        {(role === "OWNER" || role === "AGENT") && (
          <>
            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>List a property</h2>
              <PropertyForm isAgent={role === "AGENT"} />
            </section>

            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>Your listings</h2>
              {myProperties.length === 0 ? (
                <p style={{ color: COLORS.textGray }}>You haven&apos;t listed any properties yet.</p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                    gap: "16px",
                  }}
                >
                  {myProperties.map((p, index: number) => {
                    return (
                      <li
                        key={p.id}
                        className="dk-card"
                        style={{
                          backgroundColor: COLORS.white,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "14px",
                          padding: "16px",
                          animationDelay: `${Math.min(index, 10) * 0.06}s`,
                        }}
                      >
                        <div style={{ marginBottom: "6px" }}>
                          <strong style={{ color: COLORS.textDark, fontSize: "15px" }}>{p.title}</strong>
                          <Badge label={p.status.replace("_", " ")} />
                          {p.verified ? <Badge label="VERIFIED" /> : <Badge label="NOT VERIFIED" />}
                          {p.featured && <Badge label="FEATURED" />}
                        </div>
                        <div style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>
                          KSh {p.price.toLocaleString()}
                        </div>
                        {p.representingName && (
                          <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "8px" }}>
                            Representing: {p.representingName}
                            {p.representingContact && <> ({p.representingContact})</>}
                          </div>
                        )}
                        <div style={{ marginBottom: "8px" }}>
                          <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                        </div>
                        <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "8px" }}>
                          {p.views} views — {p._count.savedBy} saved — {p.enquiries.length} enquir
                          {p.enquiries.length === 1 ? "y" : "ies"}
                        </div>
                        {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                          <div
                            style={{
                              backgroundColor: COLORS.amberBg,
                              color: COLORS.amberText,
                              borderRadius: "8px",
                              padding: "8px 10px",
                              fontSize: "13px",
                              marginBottom: "8px",
                            }}
                          >
                            <em>Admin note: {p.adminNote}</em>
                          </div>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
                          {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                            <Link href={`/properties/${p.id}/edit`} className="dk-link">
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link href={`/properties/${p.id}/documents`} className="dk-link">
                            Manage supporting documents
                          </Link>
                        </div>
                        {p.enquiries.length > 0 && (
                          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: "10px" }}>
                            <em style={{ color: COLORS.textDark, fontSize: "13px" }}>Enquiries:</em>
                            <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
                              {p.enquiries.map((e: Enquiry & { buyer: Pick<User, "name" | "email"> }) => (
                                <li key={e.id} style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "4px" }}>
                                  <strong style={{ color: COLORS.textDark }}>{e.buyer.name || e.buyer.email}</strong>: {e.message}
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

        {role === "ADMIN" && (
          <>
            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>Listings awaiting review</h2>
              <PropertyApprovalList properties={pendingProperties} />
            </section>

            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>Enquiries awaiting review</h2>
              <EnquiryApprovalList enquiries={pendingEnquiries} />
            </section>

            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>All listings</h2>

              <form method="get" className="dk-filter-form">
                <div style={fieldWrapperStyle}>
                  <label style={fieldLabelStyle}>Filter by status</label>
                  <select name="status" defaultValue={searchParams.status || ""} className="dk-input" style={fieldInputStyle}>
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="CHANGES_REQUESTED">Changes requested</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <button type="submit" className="dk-btn" style={primaryButtonStyle}>
                  Filter
                </button>
              </form>

              <form method="get" className="dk-filter-form">
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
                <button type="submit" className="dk-btn" style={primaryButtonStyle}>
                  Search
                </button>
              </form>

              <a href="/dashboard" className="dk-clear-link">
                Clear filters
              </a>

              <div style={{ marginTop: "16px" }}>
                <AdminPropertyList properties={allProperties} />
              </div>
            </section>

            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>Manage users</h2>

              <form method="get" className="dk-filter-form">
                <div style={fieldWrapperStyle}>
                  <label style={fieldLabelStyle}>Filter by role</label>
                  <select name="userRole" defaultValue={searchParams.userRole || ""} className="dk-input" style={fieldInputStyle}>
                    <option value="">All</option>
                    <option value="BUYER">{ROLE_LABELS.BUYER}</option>
                    <option value="OWNER">{ROLE_LABELS.OWNER}</option>
                    <option value="AGENT">{ROLE_LABELS.AGENT}</option>
                    <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                  </select>
                </div>
                <button type="submit" className="dk-btn" style={primaryButtonStyle}>
                  Filter
                </button>
              </form>

              <form method="get" className="dk-filter-form">
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
                <button type="submit" className="dk-btn" style={primaryButtonStyle}>
                  Search
                </button>
              </form>

              <a href="/dashboard" className="dk-clear-link">
                Clear filters
              </a>

              <div style={{ marginTop: "16px" }}>
                <AdminUserList users={allUsers} currentUserId={currentUserId} />
              </div>
            </section>
          </>
        )}

        {role === "BUYER" && (
          <>
            <section style={sectionCardStyle}>
              <p style={{ color: COLORS.textGray, margin: 0 }}>
                Browse properties on the{" "}
                <Link href="/" className="dk-link">
                  homepage
                </Link>
                .
              </p>
            </section>

            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>Your saved properties</h2>
              {savedProperties.length === 0 ? (
                <p style={{ color: COLORS.textGray }}>You haven&apos;t saved any properties yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {savedProperties.map((s, index: number) => (
                    <li
                      key={s.id}
                      className="dk-card"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "10px",
                        padding: "12px 16px",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                        animationDelay: `${Math.min(index, 10) * 0.05}s`,
                      }}
                    >
                      <Link href={`/properties/${s.property.id}`} className="dk-link">
                        {s.property.title}
                      </Link>
                      <span style={{ color: COLORS.primaryGreen, fontWeight: 700 }}>
                        KSh {s.property.price.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>Your enquiries</h2>
              {myEnquiries.length === 0 ? (
                <p style={{ color: COLORS.textGray }}>You haven&apos;t sent any enquiries yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {myEnquiries.map((e: EnquiryWithProperty, index: number) => {
                    const statusLabel =
                      e.status === "PENDING"
                        ? "Awaiting admin review"
                        : e.status === "APPROVED"
                          ? "Sent to seller"
                          : "Not approved";
                    return (
                      <li
                        key={e.id}
                        className="dk-card"
                        style={{
                          backgroundColor: COLORS.white,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "10px",
                          padding: "12px 16px",
                          marginBottom: "10px",
                          animationDelay: `${Math.min(index, 10) * 0.05}s`,
                        }}
                      >
                        <Link href={`/properties/${e.property.id}`} className="dk-link">
                          {e.property.title}
                        </Link>
                        <div style={{ color: COLORS.textGray, fontSize: "13px", margin: "6px 0" }}>{e.message}</div>
                        <Badge label={statusLabel} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        <section style={sectionCardStyle}>
          <h2 style={sectionHeadingStyle}>Notifications</h2>
          {receivedNotifications.length === 0 ? (
            <p style={{ color: COLORS.textGray }}>No notifications yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {receivedNotifications.map((n, index: number) => (
                <li
                  key={n.id}
                  className="dk-card"
                  style={{
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "10px",
                    padding: "12px 16px",
                    marginBottom: "10px",
                    animationDelay: `${Math.min(index, 10) * 0.05}s`,
                  }}
                >
                  {n.propertyId ? (
                    <Link href={`/properties/${n.propertyId}`} className="dk-link">
                      {n.message}
                    </Link>
                  ) : (
                    <span style={{ color: COLORS.textDark }}>{n.message}</span>
                  )}
                  <div>
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
