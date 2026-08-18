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

function Badge({ label }: { label: string }) {
  return <span>{label}</span>;
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
      <div>
        <div>
          <h1>Account suspended</h1>
          <p>
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
      <div>
        <div>
          <h1>Verify your email</h1>
          <p>
            Please verify your email address ({currentUser.email}) before using your dashboard.
          </p>
          <p>
            If you registered with email/password, you should have seen a verification link right
            after signing up. If you didn&apos;t click it (or it expired), generate a new one below.
          </p>
          <div>
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
    <div>
      <div>
        <header>
          <div>
            <h1>
              Dashboard
            </h1>
            <p>
              Logged in as <strong>{session.user.name || session.user.email}</strong>{" "}
              <Badge label={role} />
              {(role === "OWNER" || role === "AGENT") && (
                <span>
                  {currentUser.verified ? (
                    <Badge label="VERIFIED ACCOUNT" />
                  ) : (
                    <Badge label="NOT VERIFIED" />
                  )}
                </span>
              )}
            </p>
          </div>
          <div>
            <SignOutButton />
          </div>
        </header>

        <section>
          <p>
            {currentUser.phone ? (
              <>
                Phone on file: <strong>{currentUser.phone}</strong>
              </>
            ) : (
              "No phone number on file."
            )}
          </p>
          <PhoneForm currentPhone={currentUser.phone} />
        </section>

        {(role === "OWNER" || role === "AGENT") && (
          <>
            <section>
              <h2>List a property</h2>
              <PropertyForm isAgent={role === "AGENT"} />
            </section>

            <section>
              <h2>Your listings</h2>
              {myProperties.length === 0 ? (
                <p>You haven&apos;t listed any properties yet.</p>
              ) : (
                <ul>
                  {myProperties.map((p) => {
                    return (
                      <li key={p.id}>
                        <div>
                          <strong>{p.title}</strong>
                          <Badge label={p.status.replace("_", " ")} />
                          {p.verified ? (
                            <Badge label="VERIFIED" />
                          ) : (
                            <Badge label="NOT VERIFIED" />
                          )}
                          {p.featured && <Badge label="FEATURED" />}
                        </div>
                        <div>
                          KSh {p.price.toLocaleString()}
                        </div>
                        {p.representingName && (
                          <div>
                            Representing: {p.representingName}
                            {p.representingContact && <> ({p.representingContact})</>}
                          </div>
                        )}
                        <div>
                          <AvailabilityForm propertyId={p.id} currentStatus={p.availabilityStatus} />
                        </div>
                        <div>
                          {p.views} views — {p._count.savedBy} saved — {p.enquiries.length} enquir
                          {p.enquiries.length === 1 ? "y" : "ies"}
                        </div>
                        {p.adminNote && (p.status === "CHANGES_REQUESTED" || p.status === "REJECTED") && (
                          <div>
                            <em>Admin note: {p.adminNote}</em>
                          </div>
                        )}
                        <div>
                          {["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(p.status) && (
                            <Link href={`/properties/${p.id}/edit`}>
                              {p.status === "PENDING" ? "Edit listing" : "Edit and resubmit"}
                            </Link>
                          )}
                          <Link href={`/properties/${p.id}/documents`}>
                            Manage supporting documents
                          </Link>
                        </div>
                        {p.enquiries.length > 0 && (
                          <div>
                            <em>Enquiries:</em>
                            <ul>
                              {p.enquiries.map((e: Enquiry & { buyer: Pick<User, "name" | "email"> }) => (
                                <li key={e.id}>
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

        {role === "ADMIN" && (
          <>
            <section>
              <h2>Listings awaiting review</h2>
              <PropertyApprovalList properties={pendingProperties} />
            </section>

            <section>
              <h2>Enquiries awaiting review</h2>
              <EnquiryApprovalList enquiries={pendingEnquiries} />
            </section>

            <section>
              <h2>All listings</h2>

              <form method="get">
                <div>
                  <label>Filter by status</label>
                  <select
                    name="status"
                    defaultValue={searchParams.status || ""}
                  >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="CHANGES_REQUESTED">Changes requested</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <button type="submit">
                  Filter
                </button>
              </form>

              <form method="get">
                <div>
                  <label>Search by seller name or phone</label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchParams.q}
                    placeholder="e.g. Jane or 0712..."
                  />
                </div>
                <button type="submit">
                  Search
                </button>
              </form>

              <a href="/dashboard">
                Clear filters
              </a>

              <div>
                <AdminPropertyList properties={allProperties} />
              </div>
            </section>

            <section>
              <h2>Manage users</h2>

              <form method="get">
                <div>
                  <label>Filter by role</label>
                  <select
                    name="userRole"
                    defaultValue={searchParams.userRole || ""}
                  >
                    <option value="">All</option>
                    <option value="BUYER">Buyer</option>
                    <option value="OWNER">Property Owner</option>
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button type="submit">
                  Filter
                </button>
              </form>

              <form method="get">
                <div>
                  <label>Search by name, email, or phone</label>
                  <input
                    type="text"
                    name="userQ"
                    defaultValue={searchParams.userQ}
                    placeholder="e.g. Jane, jane@example.com, or 0712..."
                  />
                </div>
                <button type="submit">
                  Search
                </button>
              </form>

              <a href="/dashboard">
                Clear filters
              </a>

              <div>
                <AdminUserList users={allUsers} currentUserId={currentUserId} />
              </div>
            </section>
          </>
        )}

        {role === "BUYER" && (
          <>
            <section>
              <p>
                Browse properties on the{" "}
                <Link href="/">
                  homepage
                </Link>
                .
              </p>
            </section>

            <section>
              <h2>Your saved properties</h2>
              {savedProperties.length === 0 ? (
                <p>You haven&apos;t saved any properties yet.</p>
              ) : (
                <ul>
                  {savedProperties.map((s) => (
                    <li key={s.id}>
                      <Link href={`/properties/${s.property.id}`}>
                        {s.property.title}
                      </Link>{" "}
                      <span>
                        — KSh {s.property.price.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2>Your enquiries</h2>
              {myEnquiries.length === 0 ? (
                <p>You haven&apos;t sent any enquiries yet.</p>
              ) : (
                <ul>
                  {myEnquiries.map((e: EnquiryWithProperty) => {
                    const statusLabel =
                      e.status === "PENDING"
                        ? "Awaiting admin review"
                        : e.status === "APPROVED"
                          ? "Sent to seller"
                          : "Not approved";
                    return (
                      <li key={e.id}>
                        <Link href={`/properties/${e.property.id}`}>
                          {e.property.title}
                        </Link>
                        <div>{e.message}</div>
                        <Badge label={statusLabel} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        <section>
          <h2>Notifications</h2>
          {receivedNotifications.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            <ul>
              {receivedNotifications.map((n) => (
                <li key={n.id}>
                  {n.propertyId ? (
                    <Link href={`/properties/${n.propertyId}`}>
                      {n.message}
                    </Link>
                  ) : (
                    <span>{n.message}</span>
                  )}
                  <div>
                    <small>
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