import { ReactNode } from "react";
import Providers from "./providers";
import "./globals.css";






export const metadata = {
  title: "Notify App",
  description: "Simple MVP with admin, buyer, and seller accounts",
};

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
      </body>
    </html>
  );
}
