import Link from "next/link";

import { CodeBlock } from "@/components/CodeBlock";
import { DeferredMedia } from "@/components/DeferredMedia";
import { DownloadCta } from "@/components/DownloadCta";
import { EqCurve } from "@/components/EqCurve";
import { MediaFigure } from "@/components/MediaFigure";
import { SkinPlayer } from "@/components/SkinPlayer";
import { buildInstallSkinLink } from "@/lib/protocol";
import { suggestPreampDb } from "@/lib/eq-response";
import type { EqBand } from "@/lib/eq";
import { loadCapture, type LoadedCapture } from "@/lib/media";
import { loadHeroSkin } from "@/lib/skins-server";
import { absoluteUrl, EAPO_URL } from "@/lib/site";

/** A real AutoEq-shaped correction, used to show the curve the editor draws. */
const DEMO_BANDS: EqBand[] = [
  { type: "LowShelf", fc: 105, gainDb: 4.2, q: 0.7 },
  { type: "Peak", fc: 240, gainDb: -2.6, q: 1.1 },
  { type: "Peak", fc: 1400, gainDb: 1.4, q: 1.8 },
  { type: "Peak", fc: 3200, gainDb: -4.8, q: 2.4 },
  { type: "Peak", fc: 6100, gainDb: 3.1, q: 3.2 },
  { type: "HighShelf", fc: 9000, gainDb: -1.8, q: 0.7 },
];

export default async function HomePage() {
  const [skin, designer, eqEditor, osd] = await Promise.all([
    loadHeroSkin(),
    loadCapture("skin-designer"),
    loadCapture("eq-editor"),
    loadCapture("osd-demo"),
  ]);
  const installLink = buildInstallSkinLink({
    url: absoluteUrl(skin.zipUrl),
    name: skin.installName,
    sha256: skin.sha256,
  });

  return (
    <>
      <Hero skin={skin} />
      <Problem />
      <Skins skin={skin} installLink={installLink} designer={designer} />
      <Equalizer capture={eqEditor} />
      <Sharing />
      <Closing capture={osd} />
    </>
  );
}

async function Hero({ skin }: { skin: Awaited<ReturnType<typeof loadHeroSkin>> }) {
  return (
    <section className="border-b border-line">
      <div className="shell grid gap-14 py-16 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:py-24">
        <div>
          <p className="eyebrow">Windows 10/11 · tray app · MIT</p>
          <h1 className="mt-4 max-w-[13ch] text-[clamp(2.5rem,6vw,4rem)] font-bold text-text">
            Volume keys that reach the DAC.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Some USB DACs advertise hardware volume and then ignore every command Windows sends
            — the slider moves and nothing changes. AorinEQ takes over the volume keys and
            applies the change as digital attenuation inside{" "}
            <a href={EAPO_URL} className="text-amber underline-offset-4 hover:underline">
              Equalizer APO
            </a>
            , before the audio ever leaves the PC.
          </p>
          <p className="mt-4 max-w-xl text-lg text-muted">
            The on-screen display is a folder of your own PNGs. Every playback device gets its
            own parametric EQ. Both travel as links.
          </p>

          <div className="mt-9">
            <DownloadCta />
          </div>
        </div>

        <div className="panel relative overflow-hidden p-5 sm:p-7">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <p className="eyebrow">Live · {skin.title}</p>
            <p className="readout text-muted">
              {skin.width} × {skin.height} px
            </p>
          </div>
          <SkinPlayer skin={skin} variant="hero" initialPercent={42} />
          <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
            This is not a video. It is the skin&apos;s two PNGs composited by the same fill math
            the app runs, so what you drag here is what appears over your desktop.
          </p>
        </div>
      </div>
    </section>
  );
}

const PROBLEMS = [
  {
    label: "The dead slider",
    body: "Per-app volume works, master volume does nothing. The DAC claims USB hardware volume and then discards the host's commands, so there is no software fix inside Windows — the change has to happen upstream, in the audio chain.",
    detail: "Confirmed on the HiBy FC5 across every firmware to date.",
  },
  {
    label: "One volume, one look",
    body: "Windows' own volume flyout is not yours. There is no theme, no artwork, no position that survives an update. A volume indicator is on screen dozens of times a day and it never gets to look like anything.",
    detail: "AorinEQ's OSD is a folder: empty.png, full.png, skin.json.",
  },
  {
    label: "EQ that forgets your headphones",
    body: "Equalizer APO's config is one chain for the machine. Swap from speakers to an IEM and the correction meant for the other one is still running, so the tuning has to be edited by hand every time the output changes.",
    detail: "Here each playback device has its own chain, on top of a global one.",
  },
];

function Problem() {
  return (
    <section className="border-b border-line">
      <div className="shell py-16 lg:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold text-sand sm:text-4xl">What is actually broken</h2>
          <p className="eyebrow">−120 dB … 0 dB · 2% per press</p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
          {PROBLEMS.map((item) => (
            <article key={item.label} className="flex flex-col bg-panel p-6">
              <h3 className="font-display text-lg font-semibold text-text">{item.label}</h3>
              <p className="mt-3 flex-1 text-sm text-muted">{item.body}</p>
              <p className="readout mt-4 border-t border-line pt-3 text-mint">{item.detail}</p>
            </article>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-muted">
          The volume model is deliberately boring: 0% is a hard mute at −120 dB, 1% is −50 dB,
          100% is 0 dB, linear in dB in between, and never above 0 dB — so the chain cannot
          clip no matter where you leave the keys.
        </p>
      </div>
    </section>
  );
}

function Skins({
  skin,
  installLink,
  designer,
}: {
  skin: Awaited<ReturnType<typeof loadHeroSkin>>;
  installLink: string;
  designer: LoadedCapture;
}) {
  return (
    <section className="border-b border-line">
      <div className="shell py-16 lg:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold text-sand sm:text-4xl">
            The display is a folder you own
          </h2>
          <p className="eyebrow">
            fillStartX {skin.config.fillStartX} · fillEndX {skin.config.fillEndX}
          </p>
        </div>

        <div className="mt-10 grid gap-10 [&>*]:min-w-0 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-muted">
              A skin is two images the same size. <code className="font-mono text-text">empty.png</code>{" "}
              is the unlit plate; <code className="font-mono text-text">full.png</code> is the lit
              one. Percent maps onto the span between{" "}
              <code className="font-mono text-text">fillStartX</code> and{" "}
              <code className="font-mono text-text">fillEndX</code>, the lit layer is clipped to
              that width, and the empty layer is clipped to everything outside it — so a
              translucent bar never stacks on itself.
            </p>
            <p className="mt-4 text-muted">
              Layers can be GIFs or vertical sprite sheets, the percent number takes a colour,
              font, size, outline and shadow, and a <code className="font-mono text-text">muted.png</code>{" "}
              can replace the dim-and-badge treatment entirely. The skin designer inside the app
              builds all of it without touching JSON, and exports a zip.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/gallery"
                className="rounded-sm bg-amber px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                Browse the gallery
              </Link>
              <Link
                href="/docs/skins"
                className="rounded-sm border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
              >
                Skin format reference
              </Link>
            </div>

            <div className="mt-9">
              <MediaFigure capture={designer} />
            </div>
          </div>

          <div className="panel p-5 sm:p-6">
            <p className="eyebrow">One click from any website</p>
            <p className="mt-3 text-sm text-muted">
              A skin hosted anywhere becomes an install button. AorinEQ checks the digest before
              it writes anything and always asks first — the link opens a confirmation naming
              the skin and the host.
            </p>
            <CodeBlock label="Install link for this skin" wrap>
              {installLink}
            </CodeBlock>
            <div className="mt-4">
              <SkinPlayer skin={skin} initialPercent={78} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Equalizer({ capture }: { capture: LoadedCapture }) {
  const preamp = suggestPreampDb(DEMO_BANDS);
  return (
    <section className="border-b border-line">
      <div className="shell py-16 lg:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold text-sand sm:text-4xl">A real parametric EQ, per device</h2>
          <p className="eyebrow">20 Hz … 20 kHz · up to 64 bands</p>
        </div>

        <div className="mt-10 grid gap-10 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <div className="panel p-5 sm:p-6">
            <p className="eyebrow">Response · 6 bands</p>
            <EqCurve
              className="mt-4"
              bands={DEMO_BANDS}
              caption={`Suggested clipping preamp ${preamp.toFixed(1)} dB — the negation of the chain's own peak.`}
            />
          </div>

          <div>
            <p className="text-muted">
              Drag the curve, or type into the band strip: filter type, centre frequency, gain
              and Q. Global plus one scope per playback device, device chains stacking on the
              global one. A Simple face with bass, mid and treble sliders edits the same bands
              when that is all you want.
            </p>
            <p className="mt-4 text-muted">
              Presets are plain Equalizer APO ParametricEQ text files, so they interchange
              directly with AutoEq, Peace and anything else that speaks the format. AutoEq
              profiles import by name from inside the app.
            </p>

            <CodeBlock label="What gets written">
              {`Preamp: ${preamp.toFixed(1)} dB
Filter 1: ON LSC Fc 105 Hz Gain 4.2 dB Q 0.70
Filter 2: ON PK Fc 240 Hz Gain -2.6 dB Q 1.10
Filter 3: ON PK Fc 1400 Hz Gain 1.4 dB Q 1.80`}
            </CodeBlock>

            <Link
              href="/tools/eq-preset"
              className="inline-block rounded-sm border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
            >
              Build a shareable preset link
            </Link>
          </div>
        </div>

        <div className="mt-10">
          <DeferredMedia capture={capture} />
        </div>
      </div>
    </section>
  );
}

const SHARING = [
  {
    href: "/tools/skin-link",
    eyebrow: "aorineq://install-skin",
    title: "Turn any hosted zip into an install button",
    body: "Paste an https link to a skin zip. The site fetches it, checks the size against the app's own 20 MB limit, computes the SHA-256 and hands back a link plus a markdown snippet.",
  },
  {
    href: "/tools/eq-preset",
    eyebrow: "aorineq://apply-preset",
    title: "Send a tuning with no hosting at all",
    body: "The whole band chain is encoded into the link itself. Nothing is stored here, nothing expires, and the recipient sees the response curve in a confirmation dialog before anything is applied.",
  },
  {
    href: "/docs/protocol",
    eyebrow: "The contract",
    title: "Add install buttons to your own site",
    body: "Every parameter, every validation rule and every rejection reason, written down — so a link your site emits is a link the app accepts.",
  },
];

function Sharing() {
  return (
    <section className="border-b border-line">
      <div className="shell py-16 lg:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold text-sand sm:text-4xl">Everything travels as a link</h2>
          <p className="eyebrow">4000 character ceiling · https only</p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
          {SHARING.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col bg-panel p-6 transition-colors hover:bg-raised"
            >
              <p className="eyebrow text-amber">{item.eyebrow}</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-text">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm text-muted">{item.body}</p>
              <span className="mt-4 text-sm text-amber">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Closing({ capture }: { capture: LoadedCapture }) {
  return (
    <section>
      <div className="shell py-16 lg:py-20">
        <div className="grid gap-10 [&>*]:min-w-0 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="text-3xl font-bold text-sand sm:text-4xl">
              It keeps itself current
            </h2>
            <p className="mt-5 text-muted">
              AorinEQ checks GitHub Releases at startup and every 24 hours, verifies the new exe
              against the release&apos;s published SHA-256, swaps itself in place and restarts.
              If its folder is not writable it says so and links to the release instead. You can
              turn all of it off at first run.
            </p>
            <p className="mt-4 text-muted">
              Equalizer APO is never bundled. If it is missing, the app opens a setup guide that
              downloads the official installer, walks the one step that needs you, and verifies
              the result against your current playback device.
            </p>
            <div className="mt-8">
              <DownloadCta compact />
            </div>
          </div>

          <MediaFigure capture={capture} className="lg:self-center" />
        </div>
      </div>
    </section>
  );
}
