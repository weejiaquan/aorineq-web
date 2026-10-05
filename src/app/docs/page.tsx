import type { Metadata } from "next";
import Link from "next/link";

import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Install and setup, AirPlay to a HomePod, the skin format, and the aorineq:// URL contract for one-click installs.",
};

const CARDS = [
  {
    href: "/docs/install",
    title: "Install and setup",
    body: "What AorinEQ needs, when Equalizer APO is required and when it is not, and the one step of setup that needs you.",
  },
  {
    href: "/docs/airplay",
    title: "AirPlay",
    body: "Sending this PC's audio to a HomePod or Apple TV: what it needs, how to hear it on the speaker only, what the latency modes really mean, and which device the volume keys end up driving.",
  },
  {
    href: "/docs/skins",
    title: "Skin format",
    body: "Every skin.json field, the fill range, sprite sheets and GIF layers, the muted layer, and what makes a skin fail to load.",
  },
  {
    href: "/docs/protocol",
    title: "aorineq:// contract",
    body: "The four actions, their parameters, the validation rules, and what a link that gets rejected looks like from the user's side.",
  },
];

export default function DocsIndexPage() {
  return (
    <>
      <p className="eyebrow">Reference</p>
      <h1 className="title mt-3 text-4xl text-text">Documentation</h1>
      <p className="mt-5 text-lg text-muted">
        AorinEQ is a tray app that drives your volume keys, draws an on-screen display from artwork
        you supply, writes parametric filters into Equalizer APO, and can send the result to an
        AirPlay speaker. These pages cover getting it running, the AirPlay side, and the two parts
        other people build against — the skin format and the URL scheme.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-line bg-line">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-panel p-6 transition-colors hover:bg-raised"
          >
            <h2 className="font-display text-lg font-semibold text-text">{card.title}</h2>
            <p className="mt-2 text-sm text-muted">{card.body}</p>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-muted">
        The app&apos;s own README is the source these pages track. When they disagree, the{" "}
        <a href={GITHUB_URL}>repository</a> is right and this is a bug worth reporting.
      </p>
    </>
  );
}
