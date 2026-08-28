import Link from "next/link";

const EXPLORE_LINKS = [
  { href: "/", label: "Browse listings" },
  { href: "/#sell-property", label: "Sell or rent out" },
  { href: "/#buy-property", label: "Find a property" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Create an account" },
  { href: "/dashboard", label: "My dashboard" },
];

const SOCIAL_LINKS = [
  {
    href: "https://facebook.com",
    label: "Facebook",
    path: "M14 9h3V6h-3c-1.66 0-3 1.34-3 3v2H9v3h2v6h3v-6h3l1-3h-4v-2c0-.55.45-1 1-1z",
  },
  {
    href: "https://instagram.com",
    label: "Instagram",
    path: "M12 8.2a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zm0 6.27a2.47 2.47 0 110-4.94 2.47 2.47 0 010 4.94zM16.2 4H7.8A3.8 3.8 0 004 7.8v8.4A3.8 3.8 0 007.8 20h8.4a3.8 3.8 0 003.8-3.8V7.8A3.8 3.8 0 0016.2 4zm2.47 12.2a2.47 2.47 0 01-2.47 2.47H7.8a2.47 2.47 0 01-2.47-2.47V7.8A2.47 2.47 0 017.8 5.33h8.4a2.47 2.47 0 012.47 2.47v8.4zM16.53 6.2a.9.9 0 100 1.8.9.9 0 000-1.8z",
  },
  {
    href: "https://x.com",
    label: "X (Twitter)",
    path: "M4 4l7.2 9.6L4.2 20H6.7l5.9-6.5 4.5 6.5H20l-7.5-10L19.3 4h-2.5l-5.4 5.9L7 4H4z",
  },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--dk-dark)] text-white/85">
      <div className="mx-auto max-w-[1280px] px-[clamp(20px,4vw,48px)] pb-8 pt-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold text-white no-underline">
              <span className="inline-flex text-[var(--dk-gold)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

            <p className="mt-3.5 text-sm leading-relaxed text-white/60">
              A trusted marketplace for verified land, homes and commercial property across Kenya —
              every listing is reviewed before it goes live.
            </p>

            <div className="mt-5 flex items-center gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors duration-150 hover:border-[var(--dk-gold)] hover:text-[var(--dk-gold)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Explore">
            <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--dk-gold)]">
              Explore
            </h3>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 no-underline transition-colors duration-150 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account */}
          <nav aria-label="Account">
            <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--dk-gold)]">
              Account
            </h3>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 no-underline transition-colors duration-150 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--dk-gold)]">
              Get in touch
            </h3>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0 text-sm text-white/65">
              <li>
                <a href="mailto:hello@daktop360.co.ke" className="no-underline transition-colors duration-150 hover:text-white">
                  hello@daktop360.co.ke
                </a>
              </li>
              <li>
                <a href="tel:+254700000000" className="no-underline transition-colors duration-150 hover:text-white">
                  +254 700 000 000
                </a>
              </li>
              <li className="text-white/50">Nairobi, Kenya</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
          <p className="m-0 text-xs text-white/45">
            © {new Date().getFullYear()} Daktop360 Realtors Limited. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs text-white/45 no-underline transition-colors duration-150 hover:text-white/80">
              Privacy
            </Link>
            <Link href="/" className="text-xs text-white/45 no-underline transition-colors duration-150 hover:text-white/80">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
