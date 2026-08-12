import type { Metadata } from "next";
import Link from "next/link";

import { SkinPlayer } from "@/components/SkinPlayer";
import { CopyButton } from "@/components/CopyButton";
import { buildInstallSkinLink } from "@/lib/protocol";
import { originLabel, type GallerySkin } from "@/lib/skins-manifest";
import { loadGallerySkins } from "@/lib/skins-server";
import { absoluteUrl, CONTACT_EMAIL, formatBytes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Skin gallery",
  description:
    "Skins for the AorinEQ on-screen display, each previewed with the app's own fill math and installable in one click.",
};

export default async function GalleryPage() {
  const skins = await loadGallerySkins();

  return (
    <div className="shell py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Gallery · {skins.length} skin{skins.length === 1 ? "" : "s"}</p>
          <h1 className="mt-3 text-4xl font-bold text-text sm:text-5xl">Skins</h1>
          <p className="mt-5 text-lg text-muted">
            Every preview here is the skin&apos;s real PNGs composited by the same fill math the
            app runs. Drag one and you are seeing what appears over your desktop, not a
            recording of it.
          </p>
        </div>
        <div className="text-sm text-muted">
          <p>
            Want yours listed?{" "}
            <Link href="/tools/skin-link" className="text-amber underline-offset-4 hover:underline">
              Build an install link
            </Link>{" "}
            for it and share that anywhere — no account needed.
          </p>
        </div>
      </div>

      {/* One skin gets a single readable column rather than half an empty grid. */}
      <div className={`mt-12 grid gap-8 ${skins.length > 1 ? "lg:grid-cols-2" : "max-w-2xl"}`}>
        {skins.map((skin) => (
          <SkinCard key={skin.id} skin={skin} />
        ))}
      </div>

      <section className="panel mt-14 max-w-3xl p-6">
        <h2 className="font-display text-lg font-semibold text-text">
          How a skin gets into this gallery
        </h2>
        <p className="mt-3 text-sm text-muted">
          V1 has no uploads and no accounts. The gallery is a JSON manifest committed to the
          site&apos;s repository, so a listing means a person read the entry and the files are
          served from here. Anyone can still distribute a skin without being listed: host the
          zip yourself and share an <code className="font-mono">aorineq://install-skin</code>{" "}
          link.
        </p>
        <p className="mt-3 text-sm text-muted">
          Fan art is allowed, on the same footing as a workshop for any other creative tool.
          That posture only works if takedowns are easy, so every card carries a report link and{" "}
          <Link href="/legal/dmca" className="text-amber underline-offset-4 hover:underline">
            the takedown route
          </Link>{" "}
          is one page away.
        </p>
      </section>
    </div>
  );
}

function SkinCard({ skin }: { skin: GallerySkin }) {
  const installLink = buildInstallSkinLink({
    url: absoluteUrl(skin.zipUrl),
    name: skin.installName,
    sha256: skin.sha256,
  });
  const reportSubject = encodeURIComponent(`Report: skin ${skin.id}`);
  const reportBody = encodeURIComponent(
    `Skin: ${skin.title} (${skin.id})\nURL: ${absoluteUrl(`/gallery#${skin.id}`)}\n\nWhat is wrong with this listing:\n`,
  );

  return (
    <article id={skin.id} className="panel flex scroll-mt-20 flex-col overflow-hidden">
      <div className="border-b border-line bg-raised p-5">
        <SkinPlayer skin={skin} initialPercent={62} />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-display text-xl font-semibold text-text">{skin.title}</h2>
          <p className="readout text-muted">
            {skin.width} × {skin.height} px · {formatBytes(skin.zipBytes)}
          </p>
        </div>

        <p className="mt-1 text-sm text-muted">
          by{" "}
          {skin.authorUrl ? (
            <a
              href={skin.authorUrl}
              className="text-amber underline-offset-4 hover:underline"
            >
              {skin.author}
            </a>
          ) : (
            <span className="text-text">{skin.author}</span>
          )}{" "}
          · {originLabel(skin.origin)}
          {/* The author's own version string for their artwork, when they gave one. */}
          {skin.version ? <> · version {skin.version}</> : null}
        </p>

        <p className="mt-4 flex-1 text-sm text-muted">{skin.description}</p>

        {skin.credit ? (
          <p className="mt-3 text-sm text-sand">{skin.credit}</p>
        ) : null}

        <ul className="mt-5 flex flex-wrap gap-2">
          {skin.tags.map((tag) => (
            <li
              key={tag}
              className="readout rounded-sm border border-line px-2 py-0.5 text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={installLink}
            className="rounded-sm bg-amber px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Install in AorinEQ
          </a>
          <a
            href={skin.zipUrl}
            download
            className="rounded-sm border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
          >
            Download .zip
          </a>
          <CopyButton value={installLink} label="Copy install link" />
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-start justify-between gap-4">
            <p className="eyebrow">SHA-256 · pinned in the install link</p>
            <CopyButton value={skin.sha256} label="Copy" />
          </div>
          <p className="readout mt-1.5 text-mint">{skin.sha256}</p>
          <p className="mt-3 text-sm">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${reportSubject}&body=${reportBody}`}
              className="text-muted underline-offset-4 hover:text-rust hover:underline"
            >
              Report this skin
            </a>
          </p>
        </div>
      </div>
    </article>
  );
}
