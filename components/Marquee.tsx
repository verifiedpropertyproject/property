const ROW_ONE = [
  "Verified Listings",
  "Trusted Landlords",
  "Prime Locations",
  "Modern Apartments",
  "Gated Communities",
  "Commercial Spaces",
  "Land for Sale",
  "Family Homes",
];

const ROW_TWO = [
  "Zero Hidden Fees",
  "Nairobi & Kiambu",
  "Book a Viewing",
  "Move-In Ready",
  "Long-Term Rentals",
  "Investment Properties",
  "Secure Transactions",
  "Daktop360 Realtors",
];

function MarqueeItem({
  label,
  accent,
}: {
  label: string;
  accent: "gold" | "primary";
}) {
  return (
    <span className="mx-4 inline-flex shrink-0 items-center whitespace-nowrap sm:mx-6">
      <span
        className={`font-[family-name:var(--font-display)] text-[clamp(1.05rem,1.9vw,1.5rem)] font-medium tracking-tight ${
          accent === "gold" ? "text-[var(--dk-ink)]" : "text-[var(--dk-primary)]"
        }`}
        style={accent === "primary" ? { fontStyle: "italic" } : undefined}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`mx-4 inline-block h-1 w-1 rounded-full sm:mx-6 ${
          accent === "gold" ? "bg-[var(--dk-gold)]" : "bg-[var(--dk-primary)]"
        }`}
      />
    </span>
  );
}

function MarqueeRow({
  items,
  direction,
  duration,
  accent,
}: {
  items: string[];
  direction: "left" | "right";
  duration: string;
  accent: "gold" | "primary";
}) {
  // Duplicate the list so the strip can loop seamlessly at -50%.
  const content = [...items, ...items];

  return (
    <div className="dk-marquee-fade group relative flex overflow-hidden">
      <div
        className={`flex shrink-0 items-center group-hover:[animation-play-state:paused] ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
        style={{ animationDuration: duration }}
      >
        {content.map((item, i) => (
          <MarqueeItem key={i} label={item} accent={accent} />
        ))}
      </div>
      <div
        className={`flex shrink-0 items-center group-hover:[animation-play-state:paused] ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
        style={{ animationDuration: duration }}
        aria-hidden="true"
      >
        {content.map((item, i) => (
          <MarqueeItem key={i} label={item} accent={accent} />
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section
      aria-label="What we offer"
      className="relative border-y border-[var(--dk-border)] bg-[var(--dk-ivory)] py-9 sm:py-11"
    >
      <div className="flex flex-col gap-4 sm:gap-5">
        <MarqueeRow items={ROW_ONE} direction="left" duration="340s" accent="gold" />
        <div className="mx-auto h-px w-[min(90%,1100px)] bg-[var(--dk-border)]" />
        <MarqueeRow items={ROW_TWO} direction="right" duration="380s" accent="primary" />
      </div>
    </section>
  );
}
