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
    <div ref={wrapperRef} className="relative inline-block">
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="dk-theme-toggle relative"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--dk-danger-ink)] px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="dk-nav-account-menu absolute right-0 top-[calc(100%+8px)] z-20 max-h-[400px] min-w-[280px] max-w-[360px] overflow-y-auto">
          <div className="px-2.5 py-1.5">
            <strong className="text-sm font-semibold text-[var(--dk-heading)]">Notifications</strong>
          </div>

          {loading && <p className="px-2.5 py-2 text-sm text-[var(--dk-muted)]">Loading...</p>}
          {error && <p className="px-2.5 py-2 text-sm text-[var(--dk-danger-ink)]">{error}</p>}

          {!loading && !error && loaded && notifications.length === 0 && (
            <p className="px-2.5 py-2 text-sm text-[var(--dk-muted)]">No notifications yet.</p>
          )}

          {!loading && !error && notifications.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-[var(--dk-ink)] transition-colors duration-150 hover:bg-[var(--dk-ivory)]"
                >
                  {n.propertyId ? (
                    <Link
                      href={`/properties/${n.propertyId}`}
                      onClick={() => setOpen(false)}
                      className="font-medium text-[var(--dk-ink)] no-underline hover:text-[var(--dk-primary)]"
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <span>{n.message}</span>
                  )}
                  <div>
                    <small className="text-xs text-[var(--dk-muted)]">
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
