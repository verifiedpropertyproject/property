import Link from "next/link";

// Shared palette — keep in sync with Header.tsx and the home page
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  textGray: "#9CA3AF",
  border: "rgba(255,255,255,0.12)",
  white: "#FFFFFF",
};

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Buy Property", href: "/?listingType=SALE" },
  { label: "Sell Property", href: "/sell" },
  { label: "Verified Properties", href: "/?availabilityStatus=AVAILABLE" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const PROPERTY_TYPES = [
  { label: "Residential Homes", href: "/?propertyType=RESIDENTIAL" },
  { label: "Land & Plots", href: "/?propertyType=LAND" },
  { label: "Commercial Property", href: "/?propertyType=COMMERCIAL" },
  { label: "Rentals", href: "/?listingType=RENT" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://web.facebook.com/people/Daktop360-Realtors-Limited/61589004161559/", icon: "f" },
  { label: "Instagram", href: "https://instagram.com", icon: "ig" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "in" },
  { label: "YouTube", href: "https://youtube.com", icon: "yt" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: COLORS.darkGreen, color: COLORS.white, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .dk-footer-link {
          color: ${COLORS.textGray};
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease, padding-left 0.2s ease;
          display: inline-block;
        }
        .dk-footer-link:hover {
          color: ${COLORS.white};
          padding-left: 3px;
        }
        .dk-footer-social {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.25);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: ${COLORS.white};
          text-decoration: none;
          font-size: 12px;
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          flex-shrink: 0;
        }
        .dk-footer-social:hover {
          background-color: ${COLORS.primaryGreen};
          border-color: ${COLORS.primaryGreen};
          transform: translateY(-2px);
        }
        .dk-footer-contact-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: ${COLORS.textGray};
          margin-bottom: 12px;
        }
        .dk-footer-contact-row a {
          color: ${COLORS.textGray};
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .dk-footer-contact-row a:hover {
          color: ${COLORS.white};
        }
        .dk-footer-heading {
          color: ${COLORS.white};
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 18px 0;
          letter-spacing: 0.02em;
        }
        .dk-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: 32px;
        }
        @media (max-width: 900px) {
          .dk-footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 560px) {
          .dk-footer-grid {
            grid-template-columns: 1fr;
          }
          .dk-footer-bottom {
            flex-direction: column;
            text-align: center;
            gap: 10px !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "48px clamp(16px, 4vw, 40px) 32px",
        }}
      >
        <div className="dk-footer-grid">
          {/* Brand / about */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  backgroundColor: COLORS.primaryGreen,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.white,
                  fontWeight: 800,
                  fontSize: "13px",
                  flexShrink: 0,
                }}
              >
                360
              </div>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 800, fontSize: "17px", letterSpacing: "0.01em" }}>DAKTOP360</div>
                <div style={{ fontSize: "10px", color: COLORS.textGray, letterSpacing: "0.03em" }}>
                  REALTORS LIMITED
                </div>
              </div>
            </div>

            <p style={{ color: COLORS.textGray, fontSize: "14px", lineHeight: 1.7, margin: "0 0 20px 0", maxWidth: "320px" }}>
              We are a trusted real estate company offering property sales, land acquisition, consultancy, and
              investment solutions across Kenya.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="dk-footer-social"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="dk-footer-heading">Quick Links</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {QUICK_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="dk-footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Property types */}
          <div>
            <h3 className="dk-footer-heading">Property Types</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {PROPERTY_TYPES.map((link) => (
                <Link key={link.label} href={link.href} className="dk-footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="dk-footer-heading">Get in Touch</h3>

            <div className="dk-footer-contact-row">
              <span>📍</span>
              <span>St Ellis Building, Nairobi, Kenya</span>
            </div>

            <div className="dk-footer-contact-row">
              <span>☎</span>
              <a href="tel:0746114967">0746 114 967</a>
            </div>

            <div className="dk-footer-contact-row">
              <span>✉</span>
              <a href="mailto:daktop360realtors@gmail.com" style={{ wordBreak: "break-all" }}>
                daktop360realtors@gmail.com
              </a>
            </div>

            <div className="dk-footer-contact-row" style={{ marginBottom: 0 }}>
              <span>🕐</span>
              <span>Always open</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Bottom bar ---------- */}
      <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div
          className="dk-footer-bottom"
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "18px clamp(16px, 4vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            fontSize: "13px",
            color: COLORS.textGray,
          }}
        >
          <span>© {year} Daktop360 Realtors Limited. All rights reserved.</span>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/privacy" className="dk-footer-link">
              Privacy Policy
            </Link>
            <Link href="/terms" className="dk-footer-link">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
