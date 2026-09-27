export type ResaleSlide = {
  id: string;
  imageUrl: string | null;
};

const RESALE_HREF = "https://daktop360realtors.co.ke/resale";

/**
 * Homepage promo slider for properties Daktop lists directly on the market's
 * behalf — auctions, standard resales, distressed sales and foreclosures —
 * kept visually and categorically separate from the regular owner/agent
 * listings above it (see lib/resaleCategory.ts and app/resale/page.tsx).
 *
 * Sits between the main listings grid and the "Get started" section, full
 * width within .dk-container like everything else on the page.
 *
 * The crossfade + Ken Burns zoom is pure CSS (see the `.dk-rs-*` rules in
 * app/globals.css) — no client JS, no timers, and it's automatically frozen
 * by the site-wide prefers-reduced-motion rule.
 */
export default function ResaleSlider({ slides }: { slides: ResaleSlide[] }) {
  const images = slides.filter((s) => s.imageUrl).slice(0, 8);
  const count = images.length;

  return (
    <section className="dk-rs-section" aria-labelledby="dk-rs-heading">
      <div className={`dk-rs-stage dk-rs-stage--${count || 1}`}>
        {count === 0 ? (
          <div className="dk-rs-slide dk-rs-slide--fallback" aria-hidden="true" />
        ) : (
          images.map((slide, i) => (
            <img
              key={slide.id}
              src={slide.imageUrl as string}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className={`dk-rs-slide dk-rs-slide--${i}`}
            />
          ))
        )}

        <span className="dk-rs-scrim" aria-hidden="true" />

        {count > 1 && (
          <div className="dk-rs-dots" aria-hidden="true">
            {images.map((slide, i) => (
              <span key={slide.id} className="dk-rs-dot">
                <span className={`dk-rs-dot-active dk-rs-slide--${i}`} />
              </span>
            ))}
          </div>
        )}

        <div className="dk-rs-content">
          <span className="dk-kicker dk-rs-kicker">Daktop direct listings</span>
          <h2 id="dk-rs-heading" className="dk-rs-heading">
            Auctions, resales &amp; distressed sales
          </h2>
          <p className="dk-rs-lede">
            Properties we list directly on the market&apos;s behalf — auctions, standard resales,
            distressed sales and foreclosures — kept separate from our regular owner and agent listings.
          </p>
          <a href={RESALE_HREF} className="dk-hero-cta dk-rs-cta">
            Browse resale &amp; auction listings
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
