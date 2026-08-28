"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
// `exact: true` means the link is only "active" on a precise pathname match
// (used for Home, since Buy Property also lives at "/" via a query string).
const PRIMARY_LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/?listingType=SALE", label: "Buy Property" },
  { href: "/dashboard", label: "Sell Property" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
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
  const pathname = usePathname();

  const user = session?.user;

  // Links that carry a query string (e.g. Buy Property) are intentionally
  // never marked active here, since reading the query safely needs a
  // Suspense boundary this component doesn't have — plain pathname matches
  // (Home, Sell Property, About Us, Contact) are enough for a clear "you are
  // here" indicator without that complexity.
  function isLinkActive(href: string) {
    if (href.includes("?")) return false;
    return pathname === href;
  }

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
      if (window.innerWidth >= 1024) setMobileOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
            <Link
              key={link.href}
              href={link.href}
              className={`dk-nav-link${isLinkActive(link.href) ? " dk-nav-link-active" : ""}`}
              aria-current={isLinkActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "BUYER" && (
            <Link href="/dashboard/saved" className="dk-nav-link">
              Saved
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
            aria-controls="dk-mobile-menu"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div id="dk-mobile-menu" className={`dk-nav-mobile${mobileOpen ? " dk-nav-mobile-open" : ""}`}>
        <nav aria-label="Primary mobile" className="dk-nav-mobile-links">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`dk-nav-mobile-link${isLinkActive(link.href) ? " dk-nav-mobile-link-active" : ""}`}
              aria-current={isLinkActive(link.href) ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "BUYER" && (
            <Link href="/dashboard/saved" className="dk-nav-mobile-link" onClick={() => setMobileOpen(false)}>
              Saved
            </Link>
          )}
        </nav>

        <hr className="dk-nav-mobile-rule" />

        <div className="dk-nav-mobile-foot">
          {user ? (
            <>
              <div className="dk-nav-mobile-user">
                <span className="dk-nav-avatar">{initialsFor(user.name, user.email)}</span>
                <span className="dk-nav-mobile-user-name">{user.name || user.email}</span>
              </div>
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
              <Link href="/register" className="dk-nav-mobile-cta" onClick={() => setMobileOpen(false)}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
