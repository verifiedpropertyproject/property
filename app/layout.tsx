import { ReactNode } from "react";
import Providers from "./providers";

export const metadata = {
  title: "Notify App",
  description: "Simple MVP with admin, buyer, and seller accounts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
