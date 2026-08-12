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
import ResendVerificationButton from "@/components/ResendVerificationButton";
import PhoneForm from "@/components/PhoneForm";

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
};

type SavedWithProperty = SavedProperty & { property: Property };

type EnquiryWithProperty = Enquiry & { property: Pick<Property, "id" | "title"> };

type PendingEnquiry = Enquiry & {
  property: Pick<Property, "id" | "title">;
  buyer: Pick<User, "name" | "email">;
};

const STATUS_OPTIONS = ["PENDING", "APPROVED", "CHANGES_REQUESTED", "REJECTED"];
const ROLE_OPTIONS = ["BUYER", "OWNER", "AGENT", "ADMIN"];

// --- Color palette (matches the Daktop360 reference design used on the homepage) ---
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
  dangerBg: "#FDECEC",
  dangerText: "#B42318",
  warnBg: "#FEF6E7",
  warnText: "#92600B",
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: COLORS.warnBg, color: COLORS.warnText },
  APPROVED: { bg: COLORS.lightGreenBg, color: COLORS.primaryGreen },
  CHANGES_REQUESTED: { bg: COLORS.warnBg, color: COLORS.warnText },
  REJECTED: { bg: COLORS.dangerBg, color: COLORS.dangerText },
};

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  padding: "clamp(16px, 3vw, 24px)",
  marginBottom: "28px",
};

const sectionHeadingStyle: React.CSSProperties = {
  color: COLORS.darkGreen,
  marginTop: 0,
  marginBottom: "16px",
  fontSize: "18px",
};

const listItemCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.sectionBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",
  padding: "14px 16px",
  marginBottom: "12px",
};

const fieldWrapperStyle: React.CSSProperties = {
  flex: "1 1 200px",
  minWidth: "160px",
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

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        fontSize: "11px",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: "4px",
        letterSpacing: "0.02em",
        display: "inline-block",
      }}
    >
      {label}
    </span>
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

  // Always check verification status fresh from the DB rather than trusting the
  // session token, since it can go stale (e.g. right after registering).
  const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });

  if (!currentUser) {
    redirect("/login");
  }

  // Checked before the email-verification gate — a suspended account shouldn't get a hint
  // about anything else, and this catches someone already mid-session at their next visit
  // even though new sign-ins are already blocked at login.
  if (currentUser.suspended) {
    return (
      <div
        style={{
          backgroundColor: COLORS.pageBg,
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: COLORS.darkGreen, fontSize: "20px", marginBottom: "10px" }}>Account suspended</h1>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>
            Your account has been suspended. Contact support if you believe this is a mistake.
          </p>
          <div style={{ marginTop: "16px" }}>
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    return (
      <div
        style={{
          backgroundColor: COLORS.pageBg,
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "28px",
          }}
        >
          <h1 style={{ color: COLORS.darkGreen, fontSize: "20px", marginBottom: "10px" }}>Verify your email</h1>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>
            Please verify your email address ({currentUser.email}) before using your dashboard.
          </p>
          <p style={{ color: COLORS.textGray, lineHeight: 1.6 }}>
            If you registered with email/password, you should have seen a verification link right
            after signing up. If you didn&apos;t click it (or it expired), generate a new one below.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
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
            // Only approved enquiries are visible to the seller — pending ones are still with admin.
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

  // Independent filters, not combined: a search term looks across every listing regardless of
  // status, and a status selection shows every listing in that status regardless of any search.
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
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  // Independent filters, not combined: a search term looks across every user regardless of
  // role, and a role selection shows every user in that role regardless of any search.
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
      <div
        style={{
          color: COLORS.textDark,
          fontFamily: "system-ui, -apple-system, sans-serif",
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
        <style>{`
          * { box-sizing: border-box; }

          .dk-dash-btn, .dk-dash-btn button, .dk-dash-btn a {
            transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          }
          .dk-dash-link {
            color: ${COLORS.primaryGreen};
            font-weight: 600;
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .dk-dash-link:hover {
            color: ${COLORS.primaryGreenHover};
            text-decoration: underline;
          }
          .dk-dash-input:focus, .dk-dash-input:focus-visible,
          .dk-dash-select:focus, .dk-dash-select:focus-visible {
            outline: none;
            border-color: ${COLORS.primaryGreen} !important;
            box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
          }
          .dk-dash-btn-primary {
            background-color: ${COLORS.primaryGreen};
            color: ${COLORS.white};
            border: none;
            border-radius: 8px;
            padding: 9px 20px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
          }
          .dk-dash-btn-primary:hover {
            background-color: ${COLORS.primaryGreenHover};
          }
          .dk-dash-form-row {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            gap: 14px;
            margin-bottom: 10px;
          }
          .dk-dash-clear {
            color: ${COLORS.primaryGreen};
            font-weight: 500;
            text-decoration: none;
            font-size: 13px;
            transition: opacity 0.2s ease;
          }
          .dk-dash-clear:hover { opacity: 0.7; }
        `}</style>

        {/* ---------- Header / account summary ---------- */}
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ color: COLORS.darkGreen, fontSize: "clamp(22px, 3vw, 28px)", marginBottom: "8px" }}>
              Dashboard
            </h1>
            <p style={{ color: COLORS.textGray, margin: 0 }}>
              Logged in as <strong style={{ color: COLORS.textDark }}>{session.user.name || session.user.email}</strong>{" "}
              <Badge label={role} bg={COLORS.lightGreenBg} color={COLORS.primaryGreen} />
              {(role === "OWNER" || role === "AGENT") && (
                <span style={{ marginLeft: "8px" }}>
                  {currentUser.verified ? (
                    <Badge label="VERIFIED ACCOUNT" bg={COLORS.lightGreenBg} color={COLORS.primaryGreen} />
                  ) : (
                    <Badge label="NOT VERIFIED" bg={COLORS.warnBg} color={COLORS.warnText} />
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="dk-dash-btn">
            <SignOutButton />
          </div>
        </header>

        {/* ---------- Phone on file ---------- */}
        <section style={sectionCardStyle}>
          <p style={{ color: COLORS.textGray, margin: "0 0 12px 0", fontSize: "14px" }}>
            {currentUser.phone ? (
              <>
                Phone on file: <strong style={{ color: COLORS.textDark }}>{currentUser.phone}</strong>
              </>
            ) : (
              "No phone number on file."
            )}
          </p>
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
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {myProperties.map((p) => {
                    const statusStyle = STATUS_STYLES[p.status] || { bg: COLORS.sectionBg, color: COLORS.textGray };
                    return (
                      <li key={p.id} style={listItemCardStyle}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <strong style={{ color: COLORS.textDark, fontSize: "15px" }}>{p.title}</strong>
                          <Badge label={p.status.replace("_", " ")} bg={statusStyle.bg} color={statusStyle.color} />
                          {p.verified ? (
                            <Badge label="VERIFIED" bg={COLORS.lightGreenBg} color={COLORS.primaryGreen} />
                          ) : (
                            <Badge label="NOT VERIFIED" bg={COLORS.sectionBg} color={COLORS.textGray} />
                          )}
                          {p.featured && <Badge label="FEATURED" bg={COLORS.darkGreen} color={COLORS.white} />}
                        </div>
                        <div style={{ color: COLORS.primaryGreen, fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>
                          KSh {p.price.toLocaleString()}
                        </div>
                        {p.representingName && (
                          <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "6px" }}>
                            Representing: {p.representingName}
                            {p.representingContact && <> ({p.representingContact})</>}
                          </div>
                        )}
                        <div style={{ marginBottom: "8px" }}>
                          <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                        </div>
                        <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "6px" }}>
                          {p.views} views — {p._count.savedBy} saved — {p.enquiries.length} enquir
                          {p.enquiries.length === 1 ? "y" : "ies"}
                        </div>
                        {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                          <div
                            style={{
                              color: COLORS.dangerText,
                              backgroundColor: COLORS.dangerBg,
                              borderRadius: "6px",
                              padding: "8px 10px",
                              fontSize: "13px",
                              marginBottom: "8px",
                            }}
                          >
                            <em>Admin note: {p.adminNote}</em>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "13px" }}>
                          {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                            <Link href={`/properties/${p.id}/edit`} className="dk-dash-link">
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link href={`/properties/${p.id}/documents`} className="dk-dash-link">
                            Manage supporting documents
                          </Link>
                        </div>
                        {p.enquiries.length > 0 && (
                          <div style={{ marginTop: "10px" }}>
                            <em style={{ color: COLORS.textDark, fontSize: "13px" }}>Enquiries:</em>
                            <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px" }}>
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

              <form method="get" className="dk-dash-form-row">
                <div style={fieldWrapperStyle}>
                  <label style={fieldLabelStyle}>Filter by status</label>
                  <select
                    name="status"
                    defaultValue={searchParams.status || ""}
                    className="dk-dash-select dk-dash-input"
                    style={fieldInputStyle}
                  >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="CHANGES_REQUESTED">Changes requested</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <button type="submit" className="dk-dash-btn-primary">
                  Filter
                </button>
              </form>

              <form method="get" className="dk-dash-form-row">
                <div style={fieldWrapperStyle}>
                  <label style={fieldLabelStyle}>Search by seller name or phone</label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchParams.q}
                    placeholder="e.g. Jane or 0712..."
                    className="dk-dash-input"
                    style={fieldInputStyle}
                  />
                </div>
                <button type="submit" className="dk-dash-btn-primary">
                  Search
                </button>
              </form>

              <a href="/dashboard" className="dk-dash-clear">
                Clear filters
              </a>

              <div style={{ marginTop: "16px" }}>
                <AdminPropertyList properties={allProperties} />
              </div>
            </section>

            <section style={sectionCardStyle}>
              <h2 style={sectionHeadingStyle}>Manage users</h2>

              <form method="get" className="dk-dash-form-row">
                <div style={fieldWrapperStyle}>
                  <label style={fieldLabelStyle}>Filter by role</label>
                  <select
                    name="userRole"
                    defaultValue={searchParams.userRole || ""}
                    className="dk-dash-select dk-dash-input"
                    style={fieldInputStyle}
                  >
                    <option value="">All</option>
                    <option value="BUYER">Buyer</option>
                    <option value="OWNER">Property Owner</option>
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button type="submit" className="dk-dash-btn-primary">
                  Filter
                </button>
              </form>

              <form method="get" className="dk-dash-form-row">
                <div style={fieldWrapperStyle}>
                  <label style={fieldLabelStyle}>Search by name, email, or phone</label>
                  <input
                    type="text"
                    name="userQ"
                    defaultValue={searchParams.userQ}
                    placeholder="e.g. Jane, jane@example.com, or 0712..."
                    className="dk-dash-input"
                    style={fieldInputStyle}
                  />
                </div>
                <button type="submit" className="dk-dash-btn-primary">
                  Search
                </button>
              </form>

              <a href="/dashboard" className="dk-dash-clear">
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
                <Link href="/" className="dk-dash-link">
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
                  {savedProperties.map((s) => (
                    <li key={s.id} style={listItemCardStyle}>
                      <Link href={`/properties/${s.property.id}`} className="dk-dash-link">
                        {s.property.title}
                      </Link>{" "}
                      <span style={{ color: COLORS.primaryGreen, fontWeight: 700 }}>
                        — KSh {s.property.price.toLocaleString()}
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
                  {myEnquiries.map((e: EnquiryWithProperty) => {
                    const statusLabel =
                      e.status === "PENDING"
                        ? "Awaiting admin review"
                        : e.status === "APPROVED"
                          ? "Sent to seller"
                          : "Not approved";
                    const statusStyle =
                      e.status === "PENDING"
                        ? { bg: COLORS.warnBg, color: COLORS.warnText }
                        : e.status === "APPROVED"
                          ? { bg: COLORS.lightGreenBg, color: COLORS.primaryGreen }
                          : { bg: COLORS.dangerBg, color: COLORS.dangerText };
                    return (
                      <li key={e.id} style={listItemCardStyle}>
                        <Link href={`/properties/${e.property.id}`} className="dk-dash-link">
                          {e.property.title}
                        </Link>
                        <div style={{ color: COLORS.textGray, fontSize: "13px", margin: "6px 0" }}>{e.message}</div>
                        <Badge label={statusLabel} bg={statusStyle.bg} color={statusStyle.color} />
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
              {receivedNotifications.map((n) => (
                <li key={n.id} style={listItemCardStyle}>
                  {n.propertyId ? (
                    <Link href={`/properties/${n.propertyId}`} className="dk-dash-link">
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
