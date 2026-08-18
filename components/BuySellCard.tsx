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
    <section aria-labelledby="dk-buy-sell-heading">
      <h2 id="dk-buy-sell-heading">
        Whatever you&apos;re looking to do, we&apos;ve got you covered
      </h2>
      <p>
        List a property for sale or rent, or start browsing verified listings today.
      </p>

      <div>
        {/* --- Sell a Property --- */}
        <div id="sell-property">
          <div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h3>
            Sell or Rent Out a Property
          </h3>
          <p>
            List your land, home or commercial property and reach verified buyers and tenants across Kenya.
            Our team handles due diligence so listings stay trustworthy.
          </p>

          <Link href={sellHref}>
            List Your Property
          </Link>
        </div>

        {/* --- Buy a Property --- */}
        <div id="buy-property">
          <div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>

          <h3>
            Find Your Next Property
          </h3>
          <p>
            Browse verified land, homes and commercial listings for sale or rent, save your favourites,
            and connect directly with trusted sellers and agents.
          </p>

          <Link href={buyHref}>
            Browse Properties
          </Link>
        </div>
      </div>
    </section>
  );
}