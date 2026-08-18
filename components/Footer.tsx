import Link from "next/link";

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
    <footer>
      <div>
        <div>
          {/* Brand / about */}
          <div>
            <div>
              <div>
                360
              </div>
              <div>
                <div>DAKTOP360</div>
                <div>
                  REALTORS LIMITED
                </div>
              </div>
            </div>

            <p>
              We are a trusted real estate company offering property sales, land acquisition, consultancy, and
              investment solutions across Kenya.
            </p>

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

          {/* Quick links */}
          <div>
            <h3>Quick Links</h3>
            <div>
              {QUICK_LINKS.map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Property types */}
          <div>
            <h3>Property Types</h3>
            <div>
              {PROPERTY_TYPES.map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3>Get in Touch</h3>

            <div>
              <span>📍</span>
              <span>St Ellis Building, Nairobi, Kenya</span>
            </div>

            <div>
              <span>☎</span>
              <a href="tel:0746114967">0746 114 967</a>
            </div>

            <div>
              <span>✉</span>
              <a href="mailto:daktop360realtors@gmail.com">
                daktop360realtors@gmail.com
              </a>
            </div>

            <div>
              <span>🕐</span>
              <span>Always open</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Bottom bar ---------- */}
      <div>
        <div>
          <span>© {year} Daktop360 Realtors Limited. All rights reserved.</span>
          <div>
            <Link href="/privacy">
              Privacy Policy
            </Link>
            <Link href="/terms">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}