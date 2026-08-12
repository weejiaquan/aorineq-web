import Link from "next/link";

const PAGES = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/content-policy", label: "Content policy" },
  { href: "/legal/dmca", label: "Report or take down" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell py-14 lg:py-20">
      <nav aria-label="Policies" className="flex flex-wrap gap-2">
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-sm border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
          >
            {page.label}
          </Link>
        ))}
      </nav>
      <div className="doc mt-10">{children}</div>
    </div>
  );
}
