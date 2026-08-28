"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import ThemeToggle2 from "./ThemeToggle2";
import NotificationBell from "./NotificationBell";

type NavSession = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
} | null;

// Adjust these to match your real routes.
const PRIMARY_LINKS = [
  { href: "/", label: "Browse" },
  { href: "/?listingType=SALE", label: "Buy" },
  { href: "/dashboard/listings/new", label: "Sell" },
];

function initialsFor(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


  export default function Nav({ session }: { session?: NavSession }) {





  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const user = session?.user;

  // Close the account dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close the mobile drawer whenever the viewport grows back to desktop.
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setMobileOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="dk-nav">
      <div className="dk-nav-inner">
        <Link href="/" className="dk-nav-brand" onClick={() => setMobileOpen(false)}>
          <span className="dk-nav-brand-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 12.5l2 2 4-4.5M12 3l2.2 1.3 2.5-.2 1 2.3 2.1 1.4-.6 2.5.6 2.5-2.1 1.4-1 2.3-2.5-.2L12 18l-2.2-1.3-2.5.2-1-2.3-2.1-1.4.6-2.5-.6-2.5 2.1-1.4 1-2.3 2.5.2L12 3z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Daktop
        </Link>

        <nav className="dk-nav-links" aria-label="Primary">
          {PRIMARY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="dk-nav-link">
              {link.label}
            </Link>
          ))}
          {user?.role === "BUYER" && (
            <Link href="/dashboard/saved" className="dk-nav-link">
              Saved
            </Link>
          )}
          {(user?.role === "SELLER" || user?.role === "AGENT") && (
            <Link href="/dashboard/listings/new" className="dk-nav-link">
              List a property
            </Link>
          )}
        </nav>

        <div className="dk-nav-actions">
          {user && <NotificationBell />}
          <ThemeToggle2 />

          {user ? (
            <div className="dk-nav-account" ref={accountRef}>
              <button
                type="button"
                className="dk-nav-account-trigger"
                onClick={() => setAccountOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <span className="dk-nav-avatar">{initialsFor(user.name, user.email)}</span>
                <span className="dk-nav-account-name">{user.name || user.email}</span>
                <span className="dk-nav-account-chevron">
                  <ChevronIcon />
                </span>
              </button>

              {accountOpen && (
                <div className="dk-nav-account-menu" role="menu">
                  <Link href="/dashboard" className="dk-nav-account-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="dk-nav-account-item dk-nav-account-item-danger"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="dk-nav-auth">
              <Link href="/login" className="dk-nav-link">
                Log in
              </Link>
              <Link href="/register" className="dk-nav-cta">
                Create account
              </Link>
            </div>
          )}

          <button
            type="button"
            className="dk-nav-burger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="dk-nav-mobile">
          {PRIMARY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="dk-nav-mobile-link" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user?.role === "BUYER" && (
            <Link href="/dashboard/saved" className="dk-nav-mobile-link" onClick={() => setMobileOpen(false)}>
              Saved
            </Link>
          )}
          {(user?.role === "SELLER" || user?.role === "AGENT") && (
            <Link href="/dashboard/listings/new" className="dk-nav-mobile-link" onClick={() => setMobileOpen(false)}>
              List a property
            </Link>
          )}

          <hr className="dk-nav-mobile-rule" />

          {user ? (
            <>
              <Link href="/dashboard" className="dk-nav-mobile-link" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
              <button
                type="button"
                className="dk-nav-mobile-link dk-nav-mobile-link-danger"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="dk-nav-mobile-link" onClick={() => setMobileOpen(false)}>
                Log in
              </Link>
              <Link href="/register" className="dk-nav-mobile-link" onClick={() => setMobileOpen(false)}>
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
