import Link from "next/link";

import { GITHUB_URL, RELEASES_URL } from "@/lib/site";

/**
 * `from` is the breakpoint below which an item is dropped. A phone gets the two destinations
 * that matter and the download; the rest appear as there is room, so the bar never has to
 * scroll sideways.
 */
const NAV = [
  { href: "/gallery", label: "Skins", from: "" },
  { href: "/tools/skin-link", label: "Link builder", from: "hidden md:block" },
  { href: "/tools/eq-preset", label: "EQ presets", from: "hidden md:block" },
  { href: "/docs", label: "Docs", from: "" },
];

const LINK_CLASS =
  "whitespace-nowrap rounded-sm px-2 py-1.5 text-sm text-muted transition-colors hover:text-text sm:px-2.5";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-sm">
      <div className="shell flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <MarkGlyph />
          <span className="font-display text-[0.95rem] font-semibold tracking-[0.14em] text-text uppercase">
            AorinEQ
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${LINK_CLASS} ${item.from}`}
            >
              {item.label}
            </Link>
          ))}
          <a href={GITHUB_URL} className={`${LINK_CLASS} hidden lg:block`}>
            GitHub
          </a>
          <a
            href={RELEASES_URL}
            className="ml-1 whitespace-nowrap rounded-sm bg-amber px-3 py-1.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 sm:ml-2"
          >
            Download
          </a>
        </nav>
      </div>
    </header>
  );
}

/**
 * The mark is the product in miniature: an unlit plate with a lit span inside it, drawn at the
 * seed skin's own proportions.
 */
function MarkGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
      <rect x="0.5" y="0.5" width="21" height="21" rx="2" className="fill-panel stroke-line" />
      <rect x="4" y="9" width="14" height="4" className="fill-line" />
      <rect x="4" y="9" width="8" height="4" className="fill-amber" />
    </svg>
  );
}
