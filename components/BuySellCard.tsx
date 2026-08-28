import Link from "next/link";
import type { Session } from "next-auth";

type Props = {
  session?: Session | null;
};

export default function BuySellCards({ session }: Props) {
  const role = session?.user?.role as string | undefined;

  const sellHref =
    role === "AGENT" ? "/dashboard/properties/new" : "/register?role=SELLER";
  const buyHref = role === "BUYER" ? "#find-a-property" : "/register?role=BUYER";

  return (
    <section aria-labelledby="dk-buy-sell-heading" className="mt-2 border-t border-[var(--dk-border)] pt-10">
      <span className="dk-kicker">Get started</span>
      <h2 id="dk-buy-sell-heading" className="dk-listings-heading">
        Whatever you&apos;re looking to do, we&apos;ve got you covered
      </h2>
      <p className="dk-lede mb-8 max-w-none">
        List a property for sale or rent, or start browsing verified listings today.
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* --- Sell a Property --- */}
        <div
          id="sell-property"
          className="flex flex-col items-start rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-card)] p-6 shadow-[0_1px_2px_var(--dk-shadow)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--dk-border-hover)] hover:shadow-[0_20px_34px_var(--dk-shadow-strong)]"
        >
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--dk-success-bg)] text-[var(--dk-primary)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dk-heading)]">
            Sell or Rent Out a Property
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-[var(--dk-muted)]">
            List your land, home or commercial property and reach verified buyers and tenants across Kenya.
            Our team handles due diligence so listings stay trustworthy.
          </p>

          <Link
            href={sellHref}
            className="mt-auto inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white no-underline transition-colors duration-150 hover:bg-[var(--dk-primary-hover)]"
          >
            List Your Property
          </Link>
        </div>

        {/* --- Buy a Property --- */}
        <div
          id="buy-property"
          className="flex flex-col items-start rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-card)] p-6 shadow-[0_1px_2px_var(--dk-shadow)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--dk-border-hover)] hover:shadow-[0_20px_34px_var(--dk-shadow-strong)]"
        >
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--dk-gold-bg)] text-[var(--dk-gold-deep)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>

          <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dk-heading)]">
            Find Your Next Property
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-[var(--dk-muted)]">
            Browse verified land, homes and commercial listings for sale or rent, save your favourites,
            and connect directly with trusted sellers and agents.
          </p>

          <Link
            href={buyHref}
            className="mt-auto inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-[var(--dk-heading)] no-underline transition-colors duration-150 hover:border-[var(--dk-border-hover)] hover:bg-[var(--dk-ivory)]"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    </section>
  );
}