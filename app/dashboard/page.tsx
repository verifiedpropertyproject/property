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
      <div>
        <h1>Account suspended</h1>
        <p>Your account has been suspended. Contact support if you believe this is a mistake.</p>
        <SignOutButton />
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    return (
      <div>
        <h1>Verify your email</h1>
        <p>
          Please verify your email address ({currentUser.email}) before using your dashboard.
        </p>
        <p>
          If you registered with email/password, you should have seen a verification link right
          after signing up. If you didn't click it (or it expired), generate a new one below.
        </p>
        <ResendVerificationButton />
        <SignOutButton />
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
    <div>
      <h1>Dashboard</h1>
      <p>
        Logged in as {session.user.name || session.user.email} ({role})
        {(role === "OWNER" || role === "AGENT") && (
          <> — {currentUser.verified ? "Verified account" : "Not verified"}</>
        )}
      </p>
      <SignOutButton />

      <p>
        {currentUser.phone ? `Phone on file: ${currentUser.phone}` : "No phone number on file."}
      </p>
      <PhoneForm currentPhone={currentUser.phone} />

      <hr />

      {(role === "OWNER" || role === "AGENT") && (
        <>
          <h2>List a property</h2>
          <PropertyForm isAgent={role === "AGENT"} />

          <h2>Your listings</h2>
          {myProperties.length === 0 ? (
            <p>You haven't listed any properties yet.</p>
          ) : (
            <ul>
              {myProperties.map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong> — {p.status} — {p.verified ? "Verified" : "Not Verified"}
                  {p.featured && <> — Featured</>} — KSh {p.price.toLocaleString()}
                  {p.representingName && (
                    <>
                      <br />
                      Representing: {p.representingName}
                      {p.representingContact && <> ({p.representingContact})</>}
                    </>
                  )}
                  <br />
                  <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                  <br />
                  {p.views} views — {p._count.savedBy} saved — {p.enquiries.length} enquir
                  {p.enquiries.length === 1 ? "y" : "ies"}
                  {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                    <>
                      <br />
                      <em>Admin note: {p.adminNote}</em>
                    </>
                  )}
                  {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                    <>
                      <br />
                      <Link href={`/properties/${p.id}/edit`}>
                        {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                      </Link>
                    </>
                  )}
                  <br />
                  <Link href={`/properties/${p.id}/documents`}>Manage supporting documents</Link>
                  {p.enquiries.length > 0 && (
                    <>
                      <br />
                      <em>Enquiries:</em>
                      <ul>
                        {p.enquiries.map((e: Enquiry & { buyer: Pick<User, "name" | "email"> }) => (
                          <li key={e.id}>
                            {e.buyer.name || e.buyer.email}: {e.message}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <hr />
        </>
      )}

      {role === "ADMIN" && (
        <>
          <h2>Listings awaiting review</h2>
          <PropertyApprovalList properties={pendingProperties} />

          <h2>Enquiries awaiting review</h2>
          <EnquiryApprovalList enquiries={pendingEnquiries} />

          <h2>All listings</h2>
          <form method="get">
            <label>
              Filter by status
              <br />
              <select name="status" defaultValue={searchParams.status || ""}>
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="CHANGES_REQUESTED">Changes requested</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>{" "}
            <button type="submit">Filter</button>
          </form>
          <form method="get">
            <label>
              Search by seller name or phone
              <br />
              <input type="text" name="q" defaultValue={searchParams.q} placeholder="e.g. Jane or 0712..." />
            </label>{" "}
            <button type="submit">Search</button>
          </form>
          <a href="/dashboard">Clear filters</a>
          <AdminPropertyList properties={allProperties} />

          <h2>Manage users</h2>
          <form method="get">
            <label>
              Filter by role
              <br />
              <select name="userRole" defaultValue={searchParams.userRole || ""}>
                <option value="">All</option>
                <option value="BUYER">Buyer</option>
                <option value="OWNER">Property Owner</option>
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>{" "}
            <button type="submit">Filter</button>
          </form>
          <form method="get">
            <label>
              Search by name, email, or phone
              <br />
              <input type="text" name="userQ" defaultValue={searchParams.userQ} placeholder="e.g. Jane, jane@example.com, or 0712..." />
            </label>{" "}
            <button type="submit">Search</button>
          </form>
          <a href="/dashboard">Clear filters</a>
          <AdminUserList users={allUsers} currentUserId={currentUserId} />

          <hr />
        </>
      )}

      {role === "BUYER" && (
        <>
          <p>
            Browse properties on the <Link href="/">homepage</Link>.
          </p>

          <h2>Your saved properties</h2>
          {savedProperties.length === 0 ? (
            <p>You haven't saved any properties yet.</p>
          ) : (
            <ul>
              {savedProperties.map((s) => (
                <li key={s.id}>
                  <Link href={`/properties/${s.property.id}`}>{s.property.title}</Link> — KSh{" "}
                  {s.property.price.toLocaleString()}
                </li>
              ))}
            </ul>
          )}

          <h2>Your enquiries</h2>
          {myEnquiries.length === 0 ? (
            <p>You haven't sent any enquiries yet.</p>
          ) : (
            <ul>
              {myEnquiries.map((e: EnquiryWithProperty) => (
                <li key={e.id}>
                  <Link href={`/properties/${e.property.id}`}>{e.property.title}</Link> — {e.message}
                  <br />
                  Status:{" "}
                  {e.status === "PENDING"
                    ? "Awaiting admin review"
                    : e.status === "APPROVED"
                      ? "Sent to seller"
                      : "Not approved"}
                </li>
              ))}
            </ul>
          )}

          <hr />
        </>
      )}
      {receivedNotifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {receivedNotifications.map((n) => (
            <li key={n.id}>
              {n.propertyId ? (
                <Link href={`/properties/${n.propertyId}`}>{n.message}</Link>
              ) : (
                n.message
              )}
              <br />
              <small>
                From {n.sender.name || n.sender.email} — {new Date(n.createdAt).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
