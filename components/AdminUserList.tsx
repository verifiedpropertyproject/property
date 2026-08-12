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

// --- Color palette (matches Daktop360 homepage / admin property list) ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  warnAmber: "#B45309",
  warnBg: "#FFFBEB",
  pageBg: "#FFFFFF",
  sectionBg: "#F7FAF8",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
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
      <p style={{ color: COLORS.textGray, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        No users yet.
      </p>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: COLORS.textDark }}>
      <style>{`
        .dk-user-card {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dk-user-card:hover {
          box-shadow: 0 4px 14px rgba(11,46,31,0.08);
          border-color: ${COLORS.primaryGreen}55;
        }
        .dk-user-btn {
          transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, transform 0.15s ease;
        }
        .dk-user-btn:hover:not(:disabled) {
          background-color: ${COLORS.lightGreenBg};
          border-color: ${COLORS.primaryGreen};
        }
        .dk-user-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .dk-user-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .dk-user-btn-delete:hover:not(:disabled) {
          background-color: ${COLORS.dangerBg} !important;
          border-color: ${COLORS.dangerRed} !important;
          color: ${COLORS.dangerRed} !important;
        }
        .dk-user-select:focus, .dk-user-select:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }
      `}</style>

      {error && (
        <p
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.dangerRed,
            border: `1px solid ${COLORS.dangerRed}33`,
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          {error}
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        {users.map((u) => {
          const label = u.name || u.email;
          const isSelf = u.id === currentUserId;
          const isAdmin = u.role === "ADMIN";
          const canBeVerified = u.role === "OWNER" || u.role === "AGENT";

          return (
            <li
              key={u.id}
              className="dk-user-card"
              style={{
                backgroundColor: COLORS.white,
                border: `1px solid ${u.suspended ? COLORS.dangerRed + "55" : COLORS.border}`,
                borderRadius: "12px",
                padding: "18px 20px",
              }}
            >
              {/* Name + email */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                <strong style={{ color: COLORS.textDark, fontSize: "16px" }}>{label}</strong>
                <span style={{ color: COLORS.textGray, fontSize: "13px" }}>{u.email}</span>
                {isSelf && (
                  <span style={{ color: COLORS.textGray, fontSize: "13px", fontStyle: "italic" }}>(you)</span>
                )}
              </div>

              {/* Phone */}
              {u.phone && (
                <div style={{ color: COLORS.textGray, fontSize: "13px", marginBottom: "8px" }}>{u.phone}</div>
              )}

              {/* Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                <span
                  style={{
                    backgroundColor: COLORS.sectionBg,
                    color: COLORS.textGray,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {u.role ? ROLE_LABELS[u.role] || u.role : "no role"}
                </span>
                {canBeVerified && (
                  <span
                    style={{
                      backgroundColor: u.verified ? COLORS.lightGreenBg : COLORS.sectionBg,
                      color: u.verified ? COLORS.primaryGreen : COLORS.textGray,
                      border: `1px solid ${u.verified ? COLORS.primaryGreen + "33" : COLORS.border}`,
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {u.verified ? "Verified" : "Not Verified"}
                  </span>
                )}
                {u.suspended && (
                  <span
                    style={{
                      backgroundColor: COLORS.dangerRed,
                      color: COLORS.white,
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    SUSPENDED
                  </span>
                )}
              </div>

              {/* Controls / restriction notes */}
              {isAdmin ? (
                <small
                  style={{
                    display: "block",
                    color: COLORS.warnAmber,
                    backgroundColor: COLORS.warnBg,
                    border: `1px solid ${COLORS.warnAmber}33`,
                    borderRadius: "6px",
                    padding: "8px 10px",
                    fontSize: "13px",
                  }}
                >
                  Admin accounts can&apos;t be suspended, deleted, or changed here.
                </small>
              ) : isSelf ? (
                <small
                  style={{
                    display: "block",
                    color: COLORS.textGray,
                    backgroundColor: COLORS.sectionBg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    padding: "8px 10px",
                    fontSize: "13px",
                  }}
                >
                  You can&apos;t suspend, delete, or change the role of your own account.
                </small>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                  <button
                    className="dk-user-btn"
                    disabled={loadingId === u.id}
                    onClick={() => toggleSuspended(u.id, u.suspended)}
                    style={{
                      backgroundColor: COLORS.white,
                      color: COLORS.textDark,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "6px",
                      padding: "7px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {loadingId === u.id ? "Working..." : u.suspended ? "Unsuspend" : "Suspend"}
                  </button>

                  {canBeVerified && (
                    <button
                      className="dk-user-btn"
                      disabled={loadingId === u.id}
                      onClick={() => toggleVerified(u.id, u.verified)}
                      style={{
                        backgroundColor: COLORS.white,
                        color: COLORS.textDark,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "6px",
                        padding: "7px 14px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {loadingId === u.id ? "Working..." : u.verified ? "Unverify" : "Verify"}
                    </button>
                  )}

                  <button
                    className="dk-user-btn dk-user-btn-delete"
                    disabled={loadingId === u.id}
                    onClick={() => handleDelete(u.id, label)}
                    style={{
                      backgroundColor: COLORS.white,
                      color: COLORS.dangerRed,
                      border: `1px solid ${COLORS.dangerRed}55`,
                      borderRadius: "6px",
                      padding: "7px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {loadingId === u.id ? "Working..." : "Delete"}
                  </button>

                  <span style={{ width: "1px", height: "22px", backgroundColor: COLORS.border, margin: "0 2px" }} />

                  <select
                    className="dk-user-select"
                    value={roleDrafts[u.id] ?? u.role ?? "BUYER"}
                    onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                    style={{
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.textDark,
                      fontSize: "13px",
                      backgroundColor: COLORS.white,
                    }}
                  >
                    <option value="BUYER">Buyer</option>
                    <option value="OWNER">Property Owner</option>
                    <option value="AGENT">Agent</option>
                  </select>

                  <button
                    className="dk-user-btn"
                    disabled={loadingId === u.id}
                    onClick={() => handleChangeRole(u.id, roleDrafts[u.id] ?? u.role ?? "BUYER")}
                    style={{
                      backgroundColor: COLORS.primaryGreen,
                      color: COLORS.white,
                      border: `1px solid ${COLORS.primaryGreen}`,
                      borderRadius: "6px",
                      padding: "7px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
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