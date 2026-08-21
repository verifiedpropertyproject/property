"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NotificationItem = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  propertyId: string | null;
  sender: { name: string | null; email: string; role: string | null };
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Poll for the unread count in the background so the badge stays current even if the person
  // never opens the dropdown.
  useEffect(() => {
    let cancelled = false;

    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnreadCount(data.unreadCount || 0);
      } catch {
        // Silent — the badge just won't update this cycle.
      }
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Close the dropdown on an outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleToggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notifications");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to load notifications (status ${res.status}).`);
        return;
      }

      setNotifications(data.notifications || []);
      setLoaded(true);

      // Mark everything read now that the person has actually seen the list, and clear the
      // badge right away rather than waiting for the next poll.
      if (data.unreadCount > 0) {
        setUnreadCount(0);
        fetch("/api/notifications/read", { method: "POST" }).catch(() => {});
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={handleToggle} aria-label="Notifications">
        {"\uD83D\uDD14"} {unreadCount > 0 && <span>({unreadCount})</span>}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            zIndex: 20,
            minWidth: "280px",
            maxWidth: "360px",
            maxHeight: "400px",
            overflowY: "auto",
            background: "white",
            border: "1px solid #ccc",
          }}
        >
          <div>
            <strong>Notifications</strong>
          </div>

          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}

          {!loading && !error && loaded && notifications.length === 0 && (
            <p>No notifications yet.</p>
          )}

          {!loading && !error && notifications.length > 0 && (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  {n.propertyId ? (
                    <Link href={`/properties/${n.propertyId}`} onClick={() => setOpen(false)}>
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
        </div>
      )}
    </div>
  );
}
