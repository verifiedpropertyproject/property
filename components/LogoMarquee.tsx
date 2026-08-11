import type { CSSProperties } from "react";

/**
 * LogoMarquee — take.app-style dual-row marquee: one row drifts left, the
 * row beneath it drifts right, each logo sits inside its own pill/tag
 * chip, and the section has NO background of its own — it inherits
 * whatever the page background is, so it reads as part of the page rather
 * than a boxed-off "logo cloud" section.
 *
 * The names below are PLACEHOLDERS standing in for real partners, brokerages,
 * banks, or media mentions — swap the `logos` array for the real ones you
 * have permission to display. Each entry is a small monogram badge + a
 * wordmark inside a tag; pass an `imageUrl` per logo to render an actual
 * asset instead of the generated badge.
 */

const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  lightGreenBg: "#E8F5EC",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

export type MarqueeLogo = {
  name: string;
  /** 2–3 letter monogram shown in the badge when no imageUrl is given */
  initials?: string;
  /** Optional real logo asset — if provided, replaces the generated badge */
  imageUrl?: string;
};

const ROW_ONE: MarqueeLogo[] = [
  { name: "Zawadi Title Co.", initials: "ZT" },
  { name: "Kilele Capital", initials: "KC" },
  { name: "Northgate Realty", initials: "NR" },
  { name: "Baraka Escrow", initials: "BE" },
  { name: "Highlands Legal", initials: "HL" },
];

const ROW_TWO: MarqueeLogo[] = [
  { name: "Amani Surveys", initials: "AS" },
  { name: "Riverside Trust Bank", initials: "RT" },
  { name: "Savanna Registry Partners", initials: "SR" },
  { name: "Copperline Brokers", initials: "CB" },
  { name: "Mto Valuers Group", initials: "MV" },
];

function LogoTag({ logo }: { logo: MarqueeLogo }) {
  return (
    <div
      className="dkm-item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "999px",
        padding: "9px 18px 9px 10px",
      }}
    >
      {logo.imageUrl ? (
        <img
          src={logo.imageUrl}
          alt={logo.name}
          style={{ height: 22, width: "auto", display: "block" }}
        />
      ) : (
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: "7px",
            backgroundColor: COLORS.lightGreenBg,
            color: COLORS.primaryGreen,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}
        >
          {logo.initials || logo.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span
        style={{
          color: COLORS.darkGreen,
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {logo.name}
      </span>
    </div>
  );
}

function MarqueeRow({
  logos,
  direction,
  speedSeconds,
}: {
  logos: MarqueeLogo[];
  direction: "left" | "right";
  speedSeconds: number;
}) {
  const track = [...logos, ...logos];
  const animationName = direction === "left" ? "dkm-scroll-left" : "dkm-scroll-right";

  return (
    <div className="dkm-viewport" style={{ width: "100%", overflow: "hidden" }}>
      <div
        className="dkm-track"
        style={{
          display: "flex",
          width: "max-content",
          gap: "14px",
          paddingLeft: "14px",
          animationName,
          animationDuration: `${speedSeconds}s`,
        }}
      >
        {track.map((logo, i) => (
          <LogoTag key={`${logo.name}-${i}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}

export default function LogoMarquee({
  rowOne = ROW_ONE,
  rowTwo = ROW_TWO,
  eyebrow = "Verified network",
  title = "Backed by the people who make a sale trustworthy",
  speedSeconds = 34,
}: {
  rowOne?: MarqueeLogo[];
  rowTwo?: MarqueeLogo[];
  eyebrow?: string;
  title?: string;
  speedSeconds?: number;
}) {
  const sectionStyle: CSSProperties = {
    width: "100%",
    padding: "clamp(28px, 5vw, 44px) 0",
    overflow: "hidden",
  };

  return (
    <section style={sectionStyle} aria-label={title}>
      <style>{`
        @keyframes dkm-scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes dkm-scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }

        .dkm-viewport {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            #000 8%,
            #000 92%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            #000 8%,
            #000 92%,
            transparent 100%
          );
        }

        .dkm-track {
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .dkm-viewport:hover .dkm-track {
          animation-play-state: paused;
        }

        .dkm-item {
          filter: grayscale(1) opacity(0.6);
          transition: filter 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }
        .dkm-item:hover {
          filter: grayscale(0) opacity(1);
          transform: translateY(-2px);
          border-color: ${COLORS.primaryGreen}55 !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .dkm-track { animation: none; }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "22px" }}>
          <div
            style={{
              color: COLORS.primaryGreen,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {eyebrow}
          </div>
          <h2
            style={{
              color: COLORS.darkGreen,
              fontSize: "clamp(16px, 2vw, 19px)",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <MarqueeRow logos={rowOne} direction="left" speedSeconds={speedSeconds} />
        <MarqueeRow logos={rowTwo} direction="right" speedSeconds={speedSeconds + 6} />
      </div>
    </section>
  );
}
