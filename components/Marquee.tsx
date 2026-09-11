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
          <span key={i} className="flex items-center">
            <span className="whitespace-nowrap px-6 font-[family-name:var(--font-display)] text-[clamp(1.1rem,2.2vw,1.65rem)] font-medium text-white/85 sm:px-8">
              {item}
            </span>
            <span aria-hidden="true" className="text-[var(--dk-gold)] text-sm opacity-60">
              ✦
            </span>
          </span>
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
          <span key={i} className="flex items-center">
            <span className="whitespace-nowrap px-6 font-[family-name:var(--font-display)] text-[clamp(1.1rem,2.2vw,1.65rem)] font-medium text-white/85 sm:px-8">
              {item}
            </span>
            <span aria-hidden="true" className="text-[var(--dk-gold)] text-sm opacity-60">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section
      aria-label="What we offer"
      className="border-t border-white/10 bg-[var(--dk-dark)] py-10 sm:py-12"
    >
      <div className="flex flex-col gap-5 sm:gap-6">
        <MarqueeRow items={ROW_ONE} direction="left" duration="70s" />
        <MarqueeRow items={ROW_TWO} direction="right" duration="80s" />
      </div>
    </section>
  );
}
