import type { Metadata } from "next";
import { Pixelify_Sans, Silkscreen } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";

const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-ik-body",
  display: "swap",
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ik-title",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IdleKing Offline MVP",
  description: "Offline-first MVP UI for IdleKing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixelifySans.variable} ${silkscreen.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
