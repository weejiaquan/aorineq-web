import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";
import "./globals.css";

/*
 * Archivo runs at an expanded width for headings — the silkscreen legend on a rack faceplate,
 * which is the register the whole site is set in. Plex Sans reads long-form docs without
 * fighting it, and Plex Mono carries everything this product actually deals in: dB values,
 * pixel coordinates, digests and Equalizer APO filter lines.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — volume keys, skins and per-device EQ for Windows`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    type: "website",
    siteName: SITE_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-amber focus:px-3 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
