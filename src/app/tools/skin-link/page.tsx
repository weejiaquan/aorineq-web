import type { Metadata } from "next";
import Link from "next/link";

import { SkinLinkBuilder } from "@/components/SkinLinkBuilder";

export const metadata: Metadata = {
  title: "Install-link builder",
  description:
    "Paste an https link to a skin zip. The site fetches it, computes the SHA-256, and hands back an aorineq://install-skin link with a markdown snippet.",
};

export default function SkinLinkPage() {
  return (
    <div className="shell max-w-4xl py-14 lg:py-20">
      <p className="eyebrow">aorineq://install-skin</p>
      <h1 className="mt-3 text-4xl font-bold text-text sm:text-5xl">Install-link builder</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Host a skin zip wherever you like. Paste the link here and get a one-click install button
        back, with the file&apos;s SHA-256 pinned into it so AorinEQ refuses anything that
        doesn&apos;t match byte for byte.
      </p>

      <div className="mt-10">
        <SkinLinkBuilder />
      </div>

      <section className="mt-16 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-text">
            Do not use Discord attachment links
          </h2>
          <p className="mt-3 text-sm text-muted">
            Discord signs CDN URLs now: every attachment link carries an expiry, and once it
            passes the link returns an error. A skin posted as an attachment is fine to look at
            and useless to point an install button at — the button works for a day or two and
            then quietly stops for everyone who reads the message later.
          </p>
          <p className="mt-3 text-sm text-muted">
            Post the file in Discord if you want, and point the link at a copy somewhere with a
            stable URL: a GitHub release asset, an object store, a catbox-style host, your own
            site.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-text">What the app checks</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>The URL must be https, with no username or password in it.</li>
            <li>The download is capped at 20 MB.</li>
            <li>
              If the link carries a digest, mismatched bytes are refused outright — no partial
              install.
            </li>
            <li>
              Only <code className="font-mono">empty</code>, <code className="font-mono">full</code>
              , <code className="font-mono">muted</code> and{" "}
              <code className="font-mono">skin.json</code> are ever extracted, taken by name and
              never by the path inside the archive.
            </li>
            <li>
              A confirmation dialog naming the skin and the host appears before anything is
              written.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            The full rules are in the{" "}
            <Link href="/docs/protocol" className="text-amber underline-offset-4 hover:underline">
              protocol contract
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
