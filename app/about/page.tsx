import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "About Us | Daktop",
  description:
    "Daktop is a trusted marketplace for verified land, homes and commercial property across Kenya. Learn about our mission, values and the team behind every listing.",
};

const VALUES = [
  {
    title: "Verified, always",
    body: "Every listing is reviewed by our team before it goes live, and ownership documents are checked so buyers can move with confidence.",
  },
  {
    title: "Transparent pricing",
    body: "No hidden fees or inflated valuations. What you see on a listing is what you negotiate on, backed by real market data.",
  },
  {
    title: "People first",
    body: "Behind every transaction is a family, a business, or a life decision. We treat each one with the care it deserves.",
  },
];

const STATS = [
  { value: "2,400+", label: "Verified listings" },
  { value: "18", label: "Counties covered" },
  { value: "9,000+", label: "Buyers & sellers served" },
  { value: "4.8/5", label: "Average client rating" },
];

const STEPS = [
  {
    title: "List or search",
    body: "Sellers submit property details and ownership documents; buyers search by location, type and budget.",
  },
  {
    title: "We verify",
    body: "Our team confirms ownership, checks documentation and reviews every listing before it's published.",
  },
  {
    title: "Connect & close",
    body: "Buyers and sellers message directly on the platform, schedule viewings and close with confidence.",
  },
];

export default async function AboutPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="dk-page">
      <Nav session={session} />

      <div className="dk-container">
        {/* Hero */}
        <header className="max-w-2xl animate-[dkFadeIn_0.5s_ease_both]">
          <span className="dk-kicker">About Daktop</span>
          <h1 className="dk-heading !max-w-none">Real estate, done properly.</h1>
          <p className="dk-lede !max-w-none text-[15.5px] leading-relaxed">
            Daktop is a trusted marketplace for verified land, homes and commercial property across Kenya.
            We built it after watching too many buyers get burned by fake listings and disputed titles — so
            every property on our platform is reviewed by a real person before it ever reaches you.
          </p>
        </header>

        {/* Stats */}
        <section className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-4 py-6 text-center transition-colors duration-200"
            >
              <div className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--dk-heading)] sm:text-[28px]">
                {s.value}
              </div>
              <div className="mt-1.5 text-[12.5px] text-[var(--dk-muted)]">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Story */}
        <section className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <span className="dk-kicker">Our story</span>
            <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold text-[var(--dk-heading)] m-0 mb-4">
              Built to fix a broken process
            </h2>
            <p className="text-[15px] leading-[1.75] text-[var(--dk-muted)] m-0 mb-4">
              Buying or selling property in Kenya has always meant navigating brokers of varying trustworthiness,
              scanned title deeds of questionable authenticity, and prices that seem to change depending on who's
              asking. Daktop360 Realtors Limited started as a small Nairobi agency with one rule: never list a
              property we haven&apos;t personally verified.
            </p>
            <p className="text-[15px] leading-[1.75] text-[var(--dk-muted)] m-0">
              That rule became the foundation of the platform. Today, sellers list directly, buyers search with
              real filters instead of guesswork, and our review team still checks every single submission —
              because the moment we stop doing that, we stop being useful.
            </p>
          </div>

          <div className="grid gap-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-card)] p-5 shadow-[0_1px_2px_var(--dk-shadow)] transition-colors duration-200"
              >
                <h3 className="font-[family-name:var(--font-display)] text-[16.5px] font-semibold text-[var(--dk-heading)] m-0 mb-1.5">
                  {v.title}
                </h3>
                <p className="text-[14px] leading-[1.65] text-[var(--dk-muted)] m-0">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <span className="dk-kicker">How it works</span>
          <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold text-[var(--dk-heading)] m-0 mb-8">
            Three steps, no surprises
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dk-gold-bg)] font-[family-name:var(--font-display)] text-[13px] font-semibold text-[var(--dk-gold-deep)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-[16.5px] font-semibold text-[var(--dk-heading)] mt-4 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-[14px] leading-[1.65] text-[var(--dk-muted)] m-0">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 mb-6 rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-dark)] px-6 py-10 text-center sm:px-12 sm:py-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white m-0 mb-2.5 sm:text-[28px]">
            Ready to get started?
          </h2>
          <p className="text-[15px] text-white/70 m-0 mb-7 max-w-md mx-auto leading-relaxed">
            Whether you&apos;re looking for your next home or listing a property, we&apos;re here to make it simple.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/?listingType=SALE"
              className="rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-6 py-3 text-[14px] font-semibold text-white no-underline transition-colors duration-200 hover:bg-[var(--dk-primary-hover)]"
            >
              Buy Property
            </Link>
            <Link
              href="/dashboard"
              className="rounded-[var(--radius-sm)] border border-white/25 px-6 py-3 text-[14px] font-semibold text-white no-underline transition-colors duration-200 hover:border-white/50"
            >
              Sell Property
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
