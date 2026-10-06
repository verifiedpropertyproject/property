import type { ReactNode } from "react";

type Highlight = {
  label: string;
  detail: string;
  icon: ReactNode;
};

// Two rows of service highlights instead of admin-uploaded photos — no image dependency, so
// there's always something to show. Icons are inline SVG (currentColor), no external assets.
const ROW_ONE: Highlight[] = [
  {
    label: "Verified Documents",
    detail: "Title & ownership checked",
    icon: (
      <path d="M9 12.5l2 2 4-4.5M7 4h10a2 2 0 012 2v13l-4-2-3 2-3-2-4 2V6a2 2 0 012-2z" />
    ),
  },
  {
    label: "Escrow Protected",
    detail: "Funds held until transfer",
    icon: <path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />,
  },
  {
    label: "Guided Site Visits",
    detail: "We arrange & accompany",
    icon: (
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 1119 10c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    ),
  },
  {
    label: "Legal Due Diligence",
    detail: "Full title & survey review",
    icon: <path d="M4 6h16M4 12h16M4 18h9M17 15l3 3-3 3" />,
  },
  {
    label: "Mortgage Guidance",
    detail: "Financing partners on call",
    icon: <path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6" />,
  },
  {
    label: "Dedicated Manager",
    detail: "One point of contact, always",
    icon: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />,
  },
];

const ROW_TWO: Highlight[] = [
  {
    label: "Auctions & Distressed Sales",
    detail: "Direct from Daktop360",
    icon: <path d="M14 3l-9 9 4 4 9-9-4-4zM6 14l-3 6 6-3M17 6l1-1M20 3l1 1" />,
  },
  {
    label: "Kenya Coverage",
    detail: "Boots on the ground locally",
    icon: (
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 1119 10c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    ),
  },
  {
    label: "Zero Hidden Fees",
    detail: "Transparent pricing upfront",
    icon: <path d="M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.2-5 3 2.2 2.6 5 3 5 1.1 5 3-2.2 3-5 3-5-1.1-5-3" />,
  },
  {
    label: "Fast-Track Transfers",
    detail: "Paperwork handled end to end",
    icon: <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />,
  },
  {
    label: "Licensed Valuers",
    detail: "Fair, defensible pricing",
    icon: <path d="M4 21V9l8-6 8 6v12M9 21v-6h6v6" />,
  },
  {
    label: "Always-On Support",
    detail: "WhatsApp & call, any time",
    icon: <path d="M4 4h16v12H7l-3 3V4z" />,
  },
];

function HighlightCard({ item }: { item: Highlight }) {
  return (
    <div className="dk-gallery-card">
      <span className="dk-gallery-card-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {item.icon}
        </svg>
      </span>
      <span className="dk-gallery-card-text">
        <span className="dk-gallery-card-label">{item.label}</span>
        <span className="dk-gallery-card-detail">{item.detail}</span>
      </span>
    </div>
  );
}

function HighlightRow({
  items,
  direction,
  duration,
}: {
  items: Highlight[];
  direction: "left" | "right";
  duration: string;
}) {
  // Duplicated once so the track can loop seamlessly at -50% — same technique as <Marquee />.
  const content = [...items, ...items];

  return (
    <div className="dk-marquee-fade dk-gallery-row group relative flex overflow-hidden">
      <div
        className={`flex shrink-0 items-stretch group-hover:[animation-play-state:paused] ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
        style={{ animationDuration: duration }}
      >
        {content.map((item, i) => (
          <HighlightCard key={`${item.label}-${i}`} item={item} />
        ))}
      </div>
      <div
        className={`flex shrink-0 items-stretch group-hover:[animation-play-state:paused] ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
        style={{ animationDuration: duration }}
        aria-hidden="true"
      >
        {content.map((item, i) => (
          <HighlightCard key={`dup-${item.label}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

/**
 * Homepage "closer look" strip, sitting right before <Footer />. Two rows of sleek icon cards
 * drifting in opposite directions (same seamless two-track technique as <Marquee />) — no
 * admin-uploaded images required, so it always has something good-looking to show.
 */
export default function HomepageGallery() {
  return (
    <section aria-label="Why Daktop360" className="dk-gallery-section">
      <div className="dk-gallery-header">
        <span className="dk-fc-kicker">A closer look</span>
        <h2 className="dk-fc-title">The Daktop360 experience</h2>
      </div>

      <div className="dk-gallery-tracks">
        <HighlightRow items={ROW_ONE} direction="left" duration="95s" />
        <HighlightRow items={ROW_TWO} direction="right" duration="105s" />
      </div>
    </section>
  );
}

