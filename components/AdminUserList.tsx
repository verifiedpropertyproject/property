"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/propertyConstants";
import { getIdentityVerificationLabel } from "@/lib/identityVerification";

type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string | null;
  suspended: boolean;
  verified: boolean;
  identityVerificationStatus: string;
  identityVerificationNote: string | null;
  identityVerificationRequestedAt: Date | null;
};

// ---------------------------------------------------------------------------
// Same badge vocabulary as AdminPropertyList / app/dashboard/page.tsx (Tone /
// Badge), duplicated here since it's a client component in its own file —
// kept visually identical so admin actions read consistently everywhere.
// ---------------------------------------------------------------------------
type Tone = "role" | "success" | "warning" | "danger" | "accent" | "neutral";

function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const toneClasses: Record<Tone, string> = {
    role: "bg-[var(--dk-dark)] text-white",
    success: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)]",
    warning: "bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)]",
    danger: "bg-[var(--dk-danger-bg)] text-[var(--dk-danger-ink)]",
    accent: "bg-[var(--dk-success-bg)] text-[var(--dk-primary)]",
    neutral: "bg-[var(--dk-border)] text-[var(--dk-muted)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-0.5 text-xs font-semibold leading-6 ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function identityTone(status: string): Tone {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
}

const inputClass =
  "w-full rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] px-3.5 py-2 text-sm text-[var(--dk-ink)] placeholder:text-[var(--dk-placeholder)] outline-none transition focus:border-[var(--dk-primary)] focus:ring-2 focus:ring-[var(--dk-primary-ring)] disabled:cursor-not-allowed disabled:opacity-60";

const actionButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] px-4 py-2 text-sm font-semibold text-[var(--dk-heading)] transition-colors duration-150 hover:bg-[var(--dk-ivory)] hover:border-[var(--dk-border-hover)] disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--dk-primary)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] hover:border-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";

const dangerButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-4 py-2 text-sm font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

export default function AdminUserList({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [rejectNoteDrafts, setRejectNoteDrafts] = useState<Record<string, string>>({});

  async function toggleSuspended(id: string, current: boolean) {
    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(`/api/admin/users/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: !current }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update user (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  async function toggleVerified(id: string, current: boolean) {
    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(`/api/admin/users/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !current }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update user (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  async function reviewIdentityVerification(id: string, decision: "APPROVED" | "REJECTED") {
    setError("");
    setLoadingId(id);

    try {
      const note = decision === "REJECTED" ? (rejectNoteDrafts[id] || "").trim() : undefined;
      const res = await fetch(`/api/admin/users/${id}/identity-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, ...(note ? { note } : {}) }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update identity verification (status ${res.status}).`);
        return;
      }

      setRejectNoteDrafts((prev) => ({ ...prev, [id]: "" }));
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleChangeRole(id: string, newRole: string) {
    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to change role (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete the account for "${label}"? This removes their listings, enquiries, and saved properties too, and cannot be undone.`)) {
      return;
    }

    setError("");
    setLoadingId(id);

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to delete user (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (users.length === 0) {
    return <p className="text-sm text-[var(--dk-muted)]">No users yet.</p>;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-xl border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
          {error}
        </p>
      )}

      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {users.map((u) => {
          const label = u.name || u.email;
          const isSelf = u.id === currentUserId;
          const isAdmin = u.role === "ADMIN";
          const canBeVerified = u.role === "OWNER" || u.role === "AGENT";

          return (
            <li
              key={u.id}
              className="rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] p-4.5 transition-shadow duration-150 ease-in hover:border-[var(--dk-border-hover)] hover:shadow-[0_2px_8px_var(--dk-shadow-strong)] md:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-lg font-bold text-[var(--dk-heading)]">{label}</strong>
                <span className="text-sm text-[var(--dk-muted)]">{u.email}</span>
                {isSelf && <Badge label="You" tone="neutral" />}
              </div>

              {u.phone && <div className="mt-1 text-sm text-[var(--dk-muted)]">{u.phone}</div>}

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Badge label={u.role ? ROLE_LABELS[u.role] || u.role : "No role"} tone="role" />
                {canBeVerified && (
                  <Badge label={u.verified ? "Verified" : "Not Verified"} tone={u.verified ? "success" : "neutral"} />
                )}
                {canBeVerified && u.identityVerificationStatus !== "NOT_SUBMITTED" && (
                  <Badge
                    label={`Identity check: ${getIdentityVerificationLabel(u.identityVerificationStatus)}`}
                    tone={identityTone(u.identityVerificationStatus)}
                  />
                )}
                {u.suspended && <Badge label="SUSPENDED" tone="danger" />}
              </div>

              {canBeVerified && u.identityVerificationStatus === "REJECTED" && u.identityVerificationNote && (
                <div className="mt-3 rounded-xl border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
                  <small>Rejection note: {u.identityVerificationNote}</small>
                </div>
              )}

              {canBeVerified && u.identityVerificationStatus === "PENDING" && !isSelf && (
                <div className="mt-3 rounded-xl border border-[var(--dk-gold)] bg-[var(--dk-gold-bg)] px-3.5 py-3">
                  <small className="block text-sm text-[var(--dk-gold-deep)]">
                    Identity verification requested — review and decide:
                  </small>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      disabled={loadingId === u.id}
                      onClick={() => reviewIdentityVerification(u.id, "APPROVED")}
                    >
                      {loadingId === u.id ? "Working..." : "Approve identity check"}
                    </button>
                    <input
                      type="text"
                      placeholder="Reason for rejection (optional)"
                      value={rejectNoteDrafts[u.id] ?? ""}
                      onChange={(e) => setRejectNoteDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      disabled={loadingId === u.id}
                      className={`${inputClass} max-w-xs flex-1`}
                    />
                    <button
                      type="button"
                      className={dangerButtonClass}
                      disabled={loadingId === u.id}
                      onClick={() => reviewIdentityVerification(u.id, "REJECTED")}
                    >
                      {loadingId === u.id ? "Working..." : "Reject identity check"}
                    </button>
                  </div>
                </div>
              )}

              {isAdmin ? (
                <small className="mt-3 block text-sm text-[var(--dk-muted)]">
                  Admin accounts can&apos;t be suspended, deleted, or changed here.
                </small>
              ) : isSelf ? (
                <small className="mt-3 block text-sm text-[var(--dk-muted)]">
                  You can&apos;t suspend, delete, or change the role of your own account.
                </small>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-[var(--dk-border)] pt-4">
                  <button
                    type="button"
                    className={actionButtonClass}
                    disabled={loadingId === u.id}
                    onClick={() => toggleSuspended(u.id, u.suspended)}
                  >
                    {loadingId === u.id ? "Working..." : u.suspended ? "Unsuspend" : "Suspend"}
                  </button>

                  {canBeVerified && (
                    <button
                      type="button"
                      className={actionButtonClass}
                      disabled={loadingId === u.id}
                      onClick={() => toggleVerified(u.id, u.verified)}
                    >
                      {loadingId === u.id ? "Working..." : u.verified ? "Unverify" : "Verify"}
                    </button>
                  )}

                  <button
                    type="button"
                    className={dangerButtonClass}
                    disabled={loadingId === u.id}
                    onClick={() => handleDelete(u.id, label)}
                  >
                    {loadingId === u.id ? "Working..." : "Delete"}
                  </button>

                  <span className="mx-1 h-6 w-px bg-[var(--dk-border)]" />

                  <select
                    value={roleDrafts[u.id] ?? u.role ?? "BUYER"}
                    onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                    className={`${inputClass} w-auto`}
                  >
                    <option value="BUYER">{ROLE_LABELS.BUYER}</option>
                    <option value="OWNER">{ROLE_LABELS.OWNER}</option>
                    <option value="AGENT">{ROLE_LABELS.AGENT}</option>
                  </select>

                  <button
                    type="button"
                    className={actionButtonClass}
                    disabled={loadingId === u.id}
                    onClick={() => handleChangeRole(u.id, roleDrafts[u.id] ?? u.role ?? "BUYER")}
                  >
                    {loadingId === u.id ? "Working..." : "Change role"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
