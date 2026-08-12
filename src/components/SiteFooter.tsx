import Link from "next/link";

import { EAPO_URL, GITHUB_URL, ISSUES_URL } from "@/lib/site";

const COLUMNS = [
  {
    heading: "Docs",
    links: [
      { href: "/docs/install", label: "Install and setup" },
      { href: "/docs/skins", label: "Skin format" },
      { href: "/docs/protocol", label: "aorineq:// contract" },
    ],
  },
  {
    heading: "Share",
    links: [
      { href: "/gallery", label: "Skin gallery" },
      { href: "/tools/skin-link", label: "Install-link builder" },
      { href: "/tools/eq-preset", label: "EQ preset links" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/content-policy", label: "Content policy" },
      { href: "/legal/dmca", label: "Report or take down" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-text">
            AorinEQ
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            A Windows tray app for volume keys that actually move the volume, a skinnable
            on-screen display, and a per-device parametric EQ written straight into{" "}
            <a href={EAPO_URL} className="text-amber underline-offset-4 hover:underline">
              Equalizer APO
            </a>
            .
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <p className="eyebrow">{column.heading}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-3 border-t border-line py-6">
        <p className="readout text-muted">
          AorinEQ is MIT-licensed. Equalizer APO is a separate GPLv2 project and is never
          bundled here.
        </p>
        <p className="readout flex gap-4">
          <a href={GITHUB_URL} className="text-muted transition-colors hover:text-text">
            Source
          </a>
          <a href={ISSUES_URL} className="text-muted transition-colors hover:text-text">
            Issues
          </a>
        </p>
      </div>
    </footer>
  );
}
