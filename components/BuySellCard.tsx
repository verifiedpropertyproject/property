import Link from "next/link";
import type { Session } from "next-auth";

// --- Same palette used across the homepage ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  pageBg: "#FFFFFF",
  sectionBg: "#F7FAF8",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

type Props = {
  session?: Session | null;
};

export default function BuySellCards({ session }: Props) {
  // Widened to string: the app's Role enum may not include a literal
  // "SELLER" value (sellers might just be non-AGENT users), so comparing
  // against the narrow enum type fails the Vercel build. Compare as
  // plain strings instead.
  const role = session?.user?.role as string | undefined;

  const sellHref =
    role === "AGENT" ? "/dashboard/properties/new" : "/register?role=SELLER";
  const buyHref = role === "BUYER" ? "#find-a-property" : "/register?role=BUYER";

  return (
    <section aria-labelledby="dk-buy-sell-heading" style={{ margin: "36px 0" }}>
      {/* Scoped styles — same naming convention as the rest of the page (dk- prefix) */}
      <style>{`
        .dk-cta-card {
          animation: fadeInUp 0.45s ease both;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .dk-cta-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(11,46,31,0.12);
          border-color: ${COLORS.primaryGreen}55;
        }
        .dk-cta-btn {
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        .dk-cta-btn:hover {
          background-color: ${COLORS.primaryGreenHover};
          box-shadow: 0 4px 12px rgba(31,122,76,0.35);
        }
        .dk-cta-btn:active {
          transform: scale(0.97);
        }
        .dk-cta-btn-outline:hover {
          background-color: ${COLORS.lightGreenBg};
        }
        @media (max-width: 640px) {
          .dk-cta-grid {
            grid-template-columns: 1fr !important;
          }
        }
        #sell-property, #buy-property {
          scroll-margin-top: 96px;
        }
      `}</style>

      <h2
        id="dk-buy-sell-heading"
        style={{ color: COLORS.darkGreen, marginBottom: "6px", fontSize: "20px" }}
      >
        Whatever you&apos;re looking to do, we&apos;ve got you covered
      </h2>
      <p style={{ color: COLORS.textGray, margin: "0 0 18px", lineHeight: 1.6 }}>
        List a property for sale or rent, or start browsing verified listings today.
      </p>

      <div
        className="dk-cta-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
        }}
      >
        {/* --- Sell a Property --- */}
        <div
          id="sell-property"
          className="dk-cta-card"
          style={{
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: COLORS.lightGreenBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.primaryGreen} strokeWidth="2">
              <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h3 style={{ color: COLORS.textDark, fontSize: "17px", margin: "0 0 8px" }}>
            Sell or Rent Out a Property
          </h3>
          <p style={{ color: COLORS.textGray, fontSize: "14px", lineHeight: 1.6, margin: "0 0 18px", flexGrow: 1 }}>
            List your land, home or commercial property and reach verified buyers and tenants across Kenya.
            Our team handles due diligence so listings stay trustworthy.
          </p>

          <Link
            href={sellHref}
            className="dk-cta-btn"
            style={{
              backgroundColor: COLORS.primaryGreen,
              color: COLORS.white,
              border: "none",
              borderRadius: "8px",
              padding: "11px 20px",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            List Your Property
          </Link>
        </div>

        {/* --- Buy a Property --- */}
        <div
          id="buy-property"
          className="dk-cta-card"
          style={{
            backgroundColor: COLORS.sectionBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.primaryGreen} strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>

          <h3 style={{ color: COLORS.textDark, fontSize: "17px", margin: "0 0 8px" }}>
            Find Your Next Property
          </h3>
          <p style={{ color: COLORS.textGray, fontSize: "14px", lineHeight: 1.6, margin: "0 0 18px", flexGrow: 1 }}>
            Browse verified land, homes and commercial listings for sale or rent, save your favourites,
            and connect directly with trusted sellers and agents.
          </p>

          <Link
            href={buyHref}
            className="dk-cta-btn dk-cta-btn-outline"
            style={{
              backgroundColor: COLORS.white,
              color: COLORS.primaryGreen,
              border: `1.5px solid ${COLORS.primaryGreen}`,
              borderRadius: "8px",
              padding: "11px 20px",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Browse Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
