"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Shared palette — keep in sync with the colors used on the home page
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Buy Property", href: "/#buy-property" },
  { label: "Sell Property", href: "/#sell-property" },
  { label: "Verified Properties", href: "/?availabilityStatus=AVAILABLE" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com", icon: "f" },
  { label: "Instagram", href: "https://instagram.com", icon: "ig" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "in" },
  { label: "YouTube", href: "https://youtube.com", icon: "yt" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Buy/Sell nav links point at #buy-property / #sell-property on the
  // homepage. When we're already on "/", clicking a link whose hash matches
  // the current hash won't fire a "hashchange" event or a Next.js
  // navigation, so nothing would scroll. Handle that case manually here;
  // otherwise let the Link navigate normally (HashScroll picks it up).
  const handleHashNavClick = (href: string) => (e: React.MouseEvent) => {
    const [path, hash] = href.split("#");
    if (!hash) return;

    const targetPath = path || "/";
    const onTargetPage = pathname === targetPath;
    const sameHash = typeof window !== "undefined" && window.location.hash === `#${hash}`;

    if (onTargetPage && sameHash) {
      e.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMenuOpen(false);
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .dk-header-link {
          transition: color 0.2s ease, opacity 0.2s ease;
        }
        .dk-header-link:hover {
          opacity: 0.75;
        }
        .dk-header-nav-link {
          position: relative;
          color: ${COLORS.textDark};
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          padding: 4px 0;
          transition: color 0.2s ease;
        }
        .dk-header-nav-link:hover {
          color: ${COLORS.primaryGreen};
        }
        .dk-header-nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0;
          height: 2px;
          background: ${COLORS.primaryGreen};
          transition: width 0.2s ease;
        }
        .dk-header-nav-link:hover::after {
          width: 100%;
        }
        .dk-header-btn-outline {
          border: 1px solid ${COLORS.darkGreen};
          color: ${COLORS.darkGreen};
          background: transparent;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .dk-header-btn-outline:hover {
          background-color: ${COLORS.darkGreen};
          color: ${COLORS.white};
        }
        .dk-header-btn-solid {
          background-color: ${COLORS.primaryGreen};
          color: ${COLORS.white};
          border: none;
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dk-header-btn-solid:hover {
          background-color: ${COLORS.primaryGreenHover};
          box-shadow: 0 4px 12px rgba(31,122,76,0.35);
        }

        /* Hamburger icon animation */
        .dk-burger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid ${COLORS.border};
          background: ${COLORS.white};
          cursor: pointer;
          flex-shrink: 0;
        }
        .dk-burger-line {
          width: 20px;
          height: 2px;
          background: ${COLORS.darkGreen};
          border-radius: 2px;
          transition: transform 0.25s ease, opacity 0.25s ease;
        }
        .dk-burger.open .dk-burger-line:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .dk-burger.open .dk-burger-line:nth-child(2) {
          opacity: 0;
        }
        .dk-burger.open .dk-burger-line:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        /* Mobile dropdown panel */
        .dk-mobile-panel {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.3s ease;
          background: ${COLORS.white};
          border-bottom: 1px solid ${COLORS.border};
        }
        .dk-mobile-panel.open {
          max-height: 480px;
        }
        .dk-mobile-link {
          display: block;
          padding: 12px clamp(16px, 4vw, 40px);
          color: ${COLORS.textDark};
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          border-bottom: 1px solid ${COLORS.border};
          transition: background-color 0.2s ease, color 0.2s ease, padding-left 0.2s ease;
        }
        .dk-mobile-link:hover {
          background-color: #F7FAF8;
          color: ${COLORS.primaryGreen};
          padding-left: calc(clamp(16px, 4vw, 40px) + 6px);
        }

        /* ---------- Responsive breakpoints ---------- */
        @media (max-width: 900px) {
          .dk-header-nav { display: none !important; }
          .dk-burger { display: flex !important; }
          .dk-header-cta-desktop { display: none !important; }
        }
        @media (max-width: 640px) {
          .dk-header-topbar-links { display: none !important; }
          .dk-header-topbar-welcome {
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .dk-header-logo-sub { display: none !important; }
        }
      `}</style>

      {/* ---------- Top strip: welcome text, contact info, socials ---------- */}
      <div
        style={{
          backgroundColor: COLORS.darkGreen,
          color: COLORS.white,
          fontSize: "13px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "8px clamp(16px, 4vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "nowrap",
            minWidth: 0,
          }}
        >
          <span className="dk-header-topbar-welcome" style={{ opacity: 0.9, minWidth: 0 }}>
            Welcome to Kenya&apos;s Trusted Property Marketplace
          </span>

          <div
            className="dk-header-topbar-links"
            style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}
          >
            <a
              href="mailto:support@daktop360.com"
              className="dk-header-link"
              style={{ color: COLORS.white, textDecoration: "none" }}
            >
              ✉ support@daktop360.com
            </a>
            <a
              href="tel:0746114967"
              className="dk-header-link"
              style={{ color: COLORS.white, textDecoration: "none" }}
            >
              ☎ 0746 114 967
            </a>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="dk-header-link"
                  style={{
                    color: COLORS.white,
                    textDecoration: "none",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Main nav: logo, links, auth actions, hamburger ---------- */}
      <div
        style={{
          backgroundColor: COLORS.white,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "14px clamp(16px, 4vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            minWidth: 0,
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", minWidth: 0, flexShrink: 0 }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: COLORS.primaryGreen,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.white,
                fontWeight: 800,
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              360
            </div>
            <div style={{ lineHeight: 1.1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "18px", color: COLORS.darkGreen, letterSpacing: "0.01em" }}>
                DAKTOP360
              </div>
              <div className="dk-header-logo-sub" style={{ fontSize: "10px", color: COLORS.textGray, letterSpacing: "0.03em" }}>
                REALTORS LIMITED
              </div>
            </div>
          </Link>

          {/* Nav links — desktop only */}
          <nav
            className="dk-header-nav"
            style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="dk-header-nav-link"
                onClick={handleHashNavClick(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth / CTA buttons — desktop only */}
          <div
            className="dk-header-cta-desktop"
            style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}
          >
            <Link
              href="/login"
              className="dk-header-btn-outline"
              style={{
                borderRadius: "8px",
                padding: "9px 16px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Login / Register
            </Link>
            <Link
              href="/properties/new"
              className="dk-header-btn-solid"
              style={{
                borderRadius: "8px",
                padding: "9px 16px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              + List Your Property
            </Link>
          </div>

          {/* Hamburger — mobile/tablet only */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={`dk-burger ${menuOpen ? "open" : ""}`}
          >
            <span className="dk-burger-line" />
            <span className="dk-burger-line" />
            <span className="dk-burger-line" />
          </button>
        </div>
      </div>

      {/* ---------- Mobile dropdown panel ---------- */}
      <div className={`dk-mobile-panel ${menuOpen ? "open" : ""}`}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="dk-mobile-link"
            onClick={handleHashNavClick(link.href)}
          >
            {link.label}
          </Link>
        ))}

        <div style={{ padding: "16px clamp(16px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link
            href="/login"
            className="dk-header-btn-outline"
            onClick={() => setMenuOpen(false)}
            style={{
              borderRadius: "8px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Login / Register
          </Link>
          <Link
            href="/properties/new"
            className="dk-header-btn-solid"
            onClick={() => setMenuOpen(false)}
            style={{
              borderRadius: "8px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            + List Your Property
          </Link>
        </div>
      </div>
    </div>
  );
}
