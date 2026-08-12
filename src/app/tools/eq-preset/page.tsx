import type { Metadata } from "next";
import Link from "next/link";

import { EqPresetBuilder } from "@/components/EqPresetBuilder";

export const metadata: Metadata = {
  title: "EQ preset links",
  description:
    "Build an aorineq://apply-preset link that carries the whole band chain inside it — nothing hosted, nothing stored, nothing to expire.",
};

export default function EqPresetPage() {
  return (
    <div className="shell py-14 lg:py-20">
      <p className="eyebrow">aorineq://apply-preset</p>
      <h1 className="mt-3 text-4xl font-bold text-text sm:text-5xl">EQ preset links</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        A tuning is a short list of numbers, so it can travel as a link rather than a file. Build
        a chain here and the whole thing is encoded into the URL — nothing is uploaded, nothing
        is stored on this site, and there is no link to expire.
      </p>
      <p className="mt-3 max-w-2xl text-muted">
        The curve below is drawn with the same RBJ biquad math the app uses, so it is the curve
        the recipient sees in their confirmation dialog before they accept anything.
      </p>

      <div className="mt-12">
        <EqPresetBuilder />
      </div>

      <section className="mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-text">What the recipient sees</h2>
          <p className="mt-3 text-sm text-muted">
            Clicking the link opens a confirmation naming the source, the scope it will land in,
            the band count, the preamp and the response curve. Nothing is applied or saved until
            they accept. A link on its own never makes AorinEQ touch the network.
          </p>
          <p className="mt-3 text-sm text-muted">
            Values outside the editor&apos;s limits are pulled to the nearest limit rather than
            refused, and a payload that does not decode cleanly is rejected whole — nothing is
            ever half-applied.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-text">
            When to host a file instead
          </h2>
          <p className="mt-3 text-sm text-muted">
            Links are capped at 4000 characters, which comfortably fits a 24-band chain. Past
            that, save the preset as a ParametricEQ .txt, host it over https, and use the{" "}
            <code className="font-mono">url=</code> form documented in the{" "}
            <Link href="/docs/protocol" className="text-amber underline-offset-4 hover:underline">
              protocol contract
            </Link>{" "}
            — with a <code className="font-mono">sha256=</code> pin, since a hosted file can
            change under you.
          </p>
        </div>
      </section>
    </div>
  );
}
