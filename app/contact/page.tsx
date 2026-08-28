import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us | Daktop",
  description:
    "Get in touch with the Daktop team — questions about buying, selling or listing verified property across Kenya.",
};

const CHANNELS = [
  {
    label: "Email",
    value: "hello@daktop360.co.ke",
    href: "mailto:hello@daktop360.co.ke",
    hint: "We reply within one business day",
  },
  {
    label: "Phone",
    value: "+254 700 000 000",
    href: "tel:+254700000000",
    hint: "Mon–Fri, 8:00–18:00 EAT",
  },
  {
    label: "Office",
    value: "Nairobi, Kenya",
    href: "https://maps.google.com/?q=Nairobi,Kenya",
    hint: "Visits by appointment",
  },
];

export default async function ContactPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="dk-page">
      <Nav session={session} />

      <div className="dk-container">
        <header className="max-w-2xl animate-[dkFadeIn_0.5s_ease_both]">
          <span className="dk-kicker">Get in touch</span>
          <h1 className="dk-heading !max-w-none">We&apos;d love to hear from you</h1>
          <p className="dk-lede !max-w-none text-[15.5px] leading-relaxed">
            Questions about a listing, help selling a property, or feedback on the platform — reach out and a
            real person on our team will get back to you.
          </p>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          {/* Channels */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {CHANNELS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.label === "Office" ? "_blank" : undefined}
                rel={c.label === "Office" ? "noopener noreferrer" : undefined}
                className="block rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-5 no-underline transition-colors duration-200 hover:border-[var(--dk-gold)]"
              >
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--dk-gold-deep)]">
                  {c.label}
                </span>
                <div className="mt-1.5 font-[family-name:var(--font-display)] text-[16.5px] font-semibold text-[var(--dk-heading)]">
                  {c.value}
                </div>
                <p className="mt-1 text-[13px] text-[var(--dk-muted)] m-0">{c.hint}</p>
              </a>
            ))}
          </div>

          {/* Form */}
          <ContactForm />
        </div>
      </div>

      <Footer />
    </div>
  );
}
