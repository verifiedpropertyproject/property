import { ReactNode } from "react";
import Providers from "./providers";
import FloatingContact from "@/components/FloatingContact";
import "./globals.css";








export const metadata = {
  title: "Daktop 360",
  description: "Buy and Sell premium properties across Nairobi and Kiambu",
};

// Same brand contact number shown in the Footer and /contact — kept as one constant here so
// both hrefs are built from a single source. Swap this for an env-driven admin number later
// if that's ever wired up sitewide the way lib/adminContact.ts does per-listing.
const CONTACT_WHATSAPP_HREF = `https://wa.me/254746114967?text=${encodeURIComponent(
  "Hi, I'd like to know more about a property on DAKTOP360."
)}`;
const CONTACT_CALL_HREF = "tel:+254746114967";

// Runs before hydration so the correct theme is applied on first paint — otherwise a
// light-mode user would see a flash of dark UI (or vice versa) on every load.
const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", dark);
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <FloatingContact whatsappHref={CONTACT_WHATSAPP_HREF} callHref={CONTACT_CALL_HREF} />
      </body>
    </html>
  );
}
