"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string | null;
  suspended: boolean;
  verified: boolean;
};

export default function AdminUserList({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});

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

  const ROLE_LABELS: Record<string, string> = {
    BUYER: "Buyer",
    OWNER: "Property Owner",
    AGENT: "Agent",
    ADMIN: "Admin",
  };

  if (users.length === 0) {
    return (
      <p>
        No users yet.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p>
          {error}
        </p>
      )}

      <ul>
        {users.map((u) => {
          const label = u.name || u.email;
          const isSelf = u.id === currentUserId;
          const isAdmin = u.role === "ADMIN";
          const canBeVerified = u.role === "OWNER" || u.role === "AGENT";

          return (
            <li key={u.id}>
              <div>
                <strong>{label}</strong>
                <span>{u.email}</span>
                {isSelf && (
                  <span>(you)</span>
                )}
              </div>

              {u.phone && (
                <div>{u.phone}</div>
              )}

              <div>
                <span>
                  {u.role ? ROLE_LABELS[u.role] || u.role : "no role"}
                </span>
                {canBeVerified && (
                  <span>
                    {u.verified ? "Verified" : "Not Verified"}
                  </span>
                )}
                {u.suspended && (
                  <span>
                    SUSPENDED
                  </span>
                )}
              </div>

              {isAdmin ? (
                <small>
                  Admin accounts can&apos;t be suspended, deleted, or changed here.
                </small>
              ) : isSelf ? (
                <small>
                  You can&apos;t suspend, delete, or change the role of your own account.
                </small>
              ) : (
                <div>
                  <button
                    disabled={loadingId === u.id}
                    onClick={() => toggleSuspended(u.id, u.suspended)}
                  >
                    {loadingId === u.id ? "Working..." : u.suspended ? "Unsuspend" : "Suspend"}
                  </button>

                  {canBeVerified && (
                    <button
                      disabled={loadingId === u.id}
                      onClick={() => toggleVerified(u.id, u.verified)}
                    >
                      {loadingId === u.id ? "Working..." : u.verified ? "Unverify" : "Verify"}
                    </button>
                  )}

                  <button
                    disabled={loadingId === u.id}
                    onClick={() => handleDelete(u.id, label)}
                  >
                    {loadingId === u.id ? "Working..." : "Delete"}
                  </button>

                  <span />

                  <select
                    value={roleDrafts[u.id] ?? u.role ?? "BUYER"}
                    onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                  >
                    <option value="BUYER">Buyer</option>
                    <option value="OWNER">Property Owner</option>
                    <option value="AGENT">Agent</option>
                  </select>

                  <button
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