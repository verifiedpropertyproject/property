"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div>
      {/* ---------- Top strip: welcome text, contact info, socials ---------- */}
      <div>
        <div>
          <span>
            Welcome to Kenya&apos;s Trusted Property Marketplace
          </span>

          <div>
            <a
              href="mailto:support@daktop360.com"
            >
              ✉ support@daktop360.com
            </a>
            <a
              href="tel:0746114967"
            >
              ☎ 0746 114 967
            </a>

            <div>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Main nav: logo, links, auth actions, hamburger ---------- */}
      <div>
        <div>
          {/* Logo */}
          <Link
            href="/"
          >
            <div>
              360
            </div>
            <div>
              <div>
                DAKTOP360
              </div>
              <div>
                REALTORS LIMITED
              </div>
            </div>
          </Link>

          {/* Nav links — desktop only */}
          <nav>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={handleHashNavClick(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth / CTA buttons — desktop only */}
          <div>
            <Link
              href="/login"
            >
              Login / Register
            </Link>
            <Link
              href="/properties/new"
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
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* ---------- Mobile dropdown panel ---------- */}
      <div>
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

        <div>
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
          >
            Login / Register
          </Link>
          <Link
            href="/properties/new"
            onClick={() => setMenuOpen(false)}
          >
            + List Your Property
          </Link>
        </div>
      </div>
    </div>
  );
}