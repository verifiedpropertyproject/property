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

function MarqueeItem({ label }: { label: string }) {
  return (
    <span className="mx-2.5 inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-5 py-2 font-[family-name:var(--font-display)] text-[clamp(0.95rem,1.6vw,1.15rem)] font-medium text-[var(--dk-ink)] sm:px-6 sm:py-2.5">
      {label}
    </span>
  );
}

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: string[];
  direction: "left" | "right";
  duration: string;
}) {
  // Duplicate the list so the strip can loop seamlessly at -50%.
  const content = [...items, ...items];

  return (
    <div className="relative flex overflow-hidden">
      <div
        className={`flex shrink-0 items-center ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
        style={{ animationDuration: duration }}
      >
        {content.map((item, i) => (
          <MarqueeItem key={i} label={item} />
        ))}
      </div>
      <div
        className={`flex shrink-0 items-center ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
        style={{ animationDuration: duration }}
        aria-hidden="true"
      >
        {content.map((item, i) => (
          <MarqueeItem key={i} label={item} />
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section
      aria-label="What we offer"
      className="border-t border-[var(--dk-border)] bg-[var(--dk-card)] py-10 sm:py-12"
    >
      <div className="flex flex-col gap-5 sm:gap-6">
        <MarqueeRow items={ROW_ONE} direction="left" duration="350s" />
        <MarqueeRow items={ROW_TWO} direction="right" duration="400s" />
      </div>
    </section>
  );
}
