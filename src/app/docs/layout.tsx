import Link from "next/link";

const SECTIONS = [
  {
    heading: "Getting started",
    links: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/install", label: "Install and setup" },
    ],
  },
  {
    heading: "Authoring",
    links: [
      { href: "/docs/skins", label: "Skin format" },
      { href: "/docs/protocol", label: "aorineq:// contract" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell grid gap-12 py-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
      <nav aria-label="Documentation" className="lg:sticky lg:top-20 lg:self-start">
        {SECTIONS.map((section) => (
          <div key={section.heading} className="mb-6">
            <p className="eyebrow">{section.heading}</p>
            <ul className="mt-2.5 space-y-1.5">
              {section.links.map((link) => (
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
          </div>
        ))}
      </nav>
      <div className="doc min-w-0">{children}</div>
    </div>
  );
}
