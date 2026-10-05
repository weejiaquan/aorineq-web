import Link from "next/link";

import { CodeBlock } from "@/components/CodeBlock";
import { DeferredMedia } from "@/components/DeferredMedia";
import { DownloadCta } from "@/components/DownloadCta";
import { EqCurve } from "@/components/EqCurve";
import { MediaFigure } from "@/components/MediaFigure";
import { Reveal } from "@/components/Reveal";
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
      <AirPlay />
      <Sharing />
      <Closing capture={osd} />
    </>
  );
}

async function Hero({ skin }: { skin: Awaited<ReturnType<typeof loadHeroSkin>> }) {
  return (
    <section className="bands border-b border-line">
      <div className="shell grid gap-14 pb-16 pt-14 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <p className="eyebrow seq">Windows 10/11 · tray app · MIT</p>
          <h1 className="title mt-5 whitespace-nowrap text-[clamp(2.5rem,4.9vw,4.25rem)] text-text">
            <span className="seq block" style={{ animationDelay: "140ms" }}>
              Volume keys
            </span>{" "}
            <span className="seq block" style={{ animationDelay: "280ms" }}>
              that reach
            </span>{" "}
            <span className="seq block" style={{ animationDelay: "420ms" }}>
              the DAC.
            </span>
          </h1>
          <div
            aria-hidden
            className="seq mt-8 h-[3px] w-28 bg-amber"
            style={{ animationDelay: "560ms" }}
          />
          <div className="seq" style={{ animationDelay: "640ms" }}>
            <p className="mt-7 max-w-xl text-lg text-muted">
              Some USB DACs advertise hardware volume and then ignore every command Windows sends
              — the slider moves and nothing changes. AorinEQ takes over the volume keys and
              applies the change as digital attenuation inside{" "}
              <a href={EAPO_URL} className="text-amber underline-offset-4 hover:underline">
                Equalizer APO
              </a>
              , before the audio ever leaves the PC.
            </p>
            <p className="mt-4 max-w-xl text-muted">
              The on-screen display is a folder of your own PNGs. Every playback device gets its
              own parametric EQ. Both travel as links. And the same audio can go straight to a
              HomePod or an Apple TV, without a second application in the way.
            </p>
          </div>

          <div className="seq mt-9" style={{ animationDelay: "780ms" }}>
            <DownloadCta />
          </div>
        </div>

        <div className="rings seq" style={{ animationDelay: "420ms" }}>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <p className="eyebrow">Live · {skin.title}</p>
            <p className="readout text-muted">
              {skin.width} × {skin.height} px
            </p>
          </div>
          <SkinPlayer skin={skin} variant="hero" initialPercent={42} />
          <p className="mt-5 max-w-lg text-sm text-muted">
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
      <div className="shell grid gap-12 py-20 [&>*]:min-w-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:py-28">
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">−120 dB … 0 dB · 2% per press</p>
          <h2 className="title mt-4 text-[clamp(2.25rem,4.6vw,3.75rem)] text-sand">
            What is actually broken
          </h2>
          <p aria-hidden className="ghost mt-8">
            −120 dB
          </p>
        </Reveal>

        <div>
          {PROBLEMS.map((item, index) => (
            <Reveal key={item.label} delay={index * 90}>
              <article className="grid gap-3 border-t border-line py-7 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-8">
                <h3 className="font-display text-xl font-semibold text-text">{item.label}</h3>
                <div>
                  <p className="text-muted">{item.body}</p>
                  <p className="readout mt-4 break-normal text-mint">{item.detail}</p>
                </div>
              </article>
            </Reveal>
          ))}

          <p className="border-t border-line pt-7 text-muted">
            The volume model is deliberately boring: 0% is a hard mute at −120 dB, 1% is −50 dB,
            100% is 0 dB, linear in dB in between, and never above 0 dB — so the chain cannot
            clip no matter where you leave the keys.
          </p>
        </div>
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
      <div className="shell grid gap-12 py-20 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:py-28">
        <div className="lg:order-2">
          <Reveal>
            <p className="eyebrow">
              fillStartX {skin.config.fillStartX} · fillEndX {skin.config.fillEndX}
            </p>
            <h2 className="title mt-4 text-[clamp(2.25rem,4.6vw,3.75rem)] text-sand">
              The display is a folder you own
            </h2>
          </Reveal>

          <p className="mt-8 text-muted">
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

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/gallery" className="btn btn-primary">
              Browse the gallery
            </Link>
            <Link href="/docs/skins" className="btn btn-ghost">
              Skin format reference
            </Link>
          </div>

          <div className="mt-10">
            <MediaFigure capture={designer} />
          </div>
        </div>

        <Reveal>
          <p aria-hidden className="ghost">
            {skin.width} × {skin.height}
          </p>
          <div className="mt-6">
            <SkinPlayer skin={skin} initialPercent={78} />
          </div>

          <div className="mt-10 border-t border-line pt-7">
            <p className="eyebrow">One click from any website</p>
            <p className="mt-3 text-sm text-muted">
              A skin hosted anywhere becomes an install button. AorinEQ checks the digest before
              it writes anything and always asks first — the link opens a confirmation naming
              the skin and the host.
            </p>
            <CodeBlock label="Install link for this skin" wrap>
              {installLink}
            </CodeBlock>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Equalizer({ capture }: { capture: LoadedCapture }) {
  const preamp = suggestPreampDb(DEMO_BANDS);
  return (
    <section className="border-b border-line">
      <div className="shell py-20 lg:py-28">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <p className="eyebrow">20 Hz … 20 kHz · up to 64 bands</p>
            <h2 className="title mt-4 max-w-[14ch] text-[clamp(2.25rem,4.6vw,3.75rem)] text-sand">
              A real parametric EQ, per device
            </h2>
          </div>
          <p aria-hidden className="ghost">
            20 Hz — 20 kHz
          </p>
        </Reveal>

        <Reveal className="mt-12 border-y border-line py-6">
          <p className="eyebrow">Response · 6 bands</p>
          <EqCurve
            className="mt-4"
            bands={DEMO_BANDS}
            caption={`Suggested clipping preamp ${preamp.toFixed(1)} dB — the negation of the chain's own peak.`}
          />
        </Reveal>

        <div className="mt-12 grid gap-10 [&>*]:min-w-0 lg:grid-cols-2 lg:gap-16">
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
          </div>

          <div>
            <CodeBlock label="What gets written">
              {`Preamp: ${preamp.toFixed(1)} dB
Filter 1: ON LSC Fc 105 Hz Gain 4.2 dB Q 0.70
Filter 2: ON PK Fc 240 Hz Gain -2.6 dB Q 1.10
Filter 3: ON PK Fc 1400 Hz Gain 1.4 dB Q 1.80`}
            </CodeBlock>

            <Link href="/tools/eq-preset" className="btn btn-ghost mt-2">
              Build a shareable preset link
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <DeferredMedia capture={capture} />
        </div>
      </div>
    </section>
  );
}

/** What AirPlay needs, and the two things about it that are not obvious. */
const AIRPLAY_NOTES = [
  {
    label: "No pairing, no account",
    body: "AorinEQ speaks the original unencrypted RAOP protocol, which every AirPlay receiver still accepts. There is no code to enter, no Apple ID, and nothing to set up on the receiver — it just has to be on the same network.",
  },
  {
    label: "Both places at once, unless you say otherwise",
    body: "By default the stream is whatever you are already listening to, so it plays on the PC and the speaker together. Pick a virtual audio device as the source and it goes to the speaker only. That is the route that works on every machine.",
  },
  {
    label: "The volume keys already do the right thing",
    body: "The stream is captured after Equalizer APO, so in preamp mode your keys have already turned it down before it is sent — set the receiver to 100% and leave it. AorinEQ works this out and greys the setting out rather than letting you attenuate twice.",
  },
];

function AirPlay() {
  return (
    <section className="border-b border-line">
      <div className="shell py-20 lg:py-28">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 lg:flex-nowrap">
          <p aria-hidden className="ghost order-2 lg:order-none">
            RAOP
          </p>
          <div className="lg:text-right">
            <p className="eyebrow">RAOP · 44.1 kHz · 250–2000 ms</p>
            <h2 className="title mt-4 max-w-[17ch] text-[clamp(2.25rem,4.6vw,3.75rem)] text-sand lg:ml-auto">
              Straight to a HomePod, with nothing in between
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-12 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="text-muted">
              Owning a HomePod and a Windows PC normally means buying something to bridge them.
              AorinEQ sends this PC&apos;s audio to a HomePod, an Apple TV or any other AirPlay
              speaker itself. Receivers announce themselves on the network; you pick one and press
              Connect.
            </p>
            <p className="mt-4 text-muted">
              How far ahead it sends is yours to choose — under a second when you are watching
              something and want the picture to match, or a couple of seconds when you are only
              listening and would rather it never break up. A live counter shows how much the
              network is actually having to resend, so the choice is not guesswork.
            </p>
            <p className="mt-4 text-muted">
              It also writes an inaudible noise floor through silence, because some receivers
              power down between tracks and clip the first moment of the next one.
            </p>

            <Link href="/docs/airplay" className="btn btn-ghost mt-8">
              How AirPlay works here
            </Link>

            <p className="mt-10 border-l-[3px] border-amber pl-5 text-sm text-muted">
              One receiver at a time, and no AirPlay 2. It is newer than the rest of the app and
              labelled experimental inside it.
            </p>
          </div>

          <div>
            {AIRPLAY_NOTES.map((note, index) => (
              <Reveal key={note.label} delay={index * 90}>
                <div className="border-t border-line py-7">
                  <h3 className="font-display text-xl font-semibold text-text">{note.label}</h3>
                  <p className="mt-3 text-muted">{note.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
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
      <div className="shell py-20 lg:py-28">
        <Reveal>
          <p className="eyebrow">4000 character ceiling · https only</p>
          <h2 className="title mt-4 text-[clamp(2.25rem,4.6vw,3.75rem)] text-sand">
            Everything travels as a link
          </h2>
        </Reveal>

        <div className="mt-12 border-b border-line">
          {SHARING.map((item, index) => (
            <Reveal key={item.href} delay={index * 90}>
              <Link
                href={item.href}
                className="group grid gap-x-10 gap-y-3 border-t border-line py-8 transition-colors hover:bg-panel md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_auto] md:items-baseline md:px-4"
              >
                <p className="readout text-base text-amber">{item.eyebrow}</p>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-text">{item.title}</h3>
                  <p className="mt-3 max-w-2xl text-muted">{item.body}</p>
                </div>
                <span
                  aria-hidden
                  className="font-display text-2xl text-amber transition-transform duration-200 group-hover:translate-x-2"
                >
                  →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Closing({ capture }: { capture: LoadedCapture }) {
  return (
    <section className="bands">
      <div className="shell grid gap-12 py-20 [&>*]:min-w-0 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <Reveal>
          <h2 className="title text-[clamp(2.25rem,4.6vw,3.75rem)] text-sand">
            It keeps itself current
          </h2>
          <p className="mt-8 text-muted">
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
          <div className="mt-9">
            <DownloadCta compact />
          </div>
        </Reveal>

        <MediaFigure capture={capture} className="lg:self-center" />
      </div>
    </section>
  );
}
