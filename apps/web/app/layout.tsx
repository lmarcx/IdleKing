import type { Metadata } from "next";
import { Cinzel, Inter, Orbitron } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ik-body",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-ik-title",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-ik-boto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IdleKing Offline MVP",
  description: "Offline-first MVP UI for IdleKing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cinzel.variable} ${orbitron.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
