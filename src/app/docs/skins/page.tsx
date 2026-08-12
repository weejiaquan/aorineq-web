import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/CodeBlock";
import { SkinPlayer } from "@/components/SkinPlayer";
import { GITHUB_URL } from "@/lib/site";
import {
  MAX_AUTHOR_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_SOURCE_URL_LENGTH,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_VERSION_LENGTH,
} from "@/lib/skin-meta";
import { loadHeroSkin } from "@/lib/skins-server";

export const metadata: Metadata = {
  title: "Skin format",
  description:
    "Every skin.json field: the fill range, percent text styling, sprite sheets, GIF layers, the muted layer and the optional credits block — plus what makes a skin fail to load.",
};

/** The desktop app's own schema reference, which this page is the readable half of. */
const REFERENCE_URL = `${GITHUB_URL}/blob/master/docs/reference.md`;

export default async function SkinDocsPage() {
  const skin = await loadHeroSkin();

  return (
    <>
      <p className="eyebrow">Authoring</p>
      <h1 className="mt-3 text-4xl font-bold text-text">Skin format</h1>
      <p className="mt-5 text-lg text-muted">
        A skin is a folder under <code className="font-mono">%APPDATA%\AorinEQ\skins\</code>. Two
        images and an optional JSON file. Everything else — the fill, the click behaviour, the
        percent number — falls out of those.
      </p>

      <h2 id="folder">The folder</h2>
      <CodeBlock label="%APPDATA%\AorinEQ\skins\my-skin\">
        {`empty.png     0%: the unlit artwork. Any size, any shape.
full.png      100%: the lit artwork. Identical frame size to empty.
skin.json     optional. Everything below.
muted.png     optional. Shown instead of the dim-and-badge mute treatment.`}
      </CodeBlock>
      <p>
        Each layer can be <code>.png</code> or <code>.gif</code>. A <code>.png</code> wins when
        both exist. The two layers&apos; frame sizes must match, or the skin fails to load and
        the app falls back to its Dark pill style with a tray warning.
      </p>

      <h2 id="fill">How the fill works</h2>
      <p>
        Percent maps onto the horizontal span between <code>fillStartX</code> and{" "}
        <code>fillEndX</code>. The full layer is clipped from the left edge out to that width;
        the empty layer is clipped to everything <em>outside</em> the lit span, so a translucent
        bar never stacks on itself and decoration outside the range keeps showing. The clip is
        always along the x-axis whatever the artwork looks like — a circular skin fills left to
        right, not radially.
      </p>
      <p>
        Keep <code>full.png</code>&apos;s lit pixels inside the range and put static decoration
        in <code>empty.png</code>. Then 0% and 100% land exactly on the bar&apos;s own pixel
        edges, for the fill and for clicks alike; clicks in the decorative margins clamp to 0
        and 100.
      </p>

      <figure className="panel my-7 p-5">
        <figcaption className="eyebrow mb-4">
          {skin.title} · fillStartX {skin.config.fillStartX} · fillEndX {skin.config.fillEndX} ·{" "}
          {skin.width} px wide
        </figcaption>
        <SkinPlayer skin={skin} variant="hero" initialPercent={35} />
      </figure>

      <p>
        The clickable shape is the union of both layers&apos; opaque pixels, independent of the
        current level, so the whole bar is draggable and not just the lit part. Transparent
        pixels are click-through — they pass the click to whatever is under the OSD.
      </p>

      <h2 id="skin-json">skin.json</h2>
      <p>
        Field names are case-insensitive. Every field is optional; an unparseable file fails the
        whole skin rather than being half-applied.
      </p>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Default</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>fillStartX</code>
            </td>
            <td>0</td>
            <td>Image-pixel x where 0% sits. Clamped into the image width.</td>
          </tr>
          <tr>
            <td>
              <code>fillEndX</code>
            </td>
            <td>image width</td>
            <td>
              Image-pixel x where 100% sits. Must be greater than <code>fillStartX</code> — an
              inverted range is an authoring error and fails the skin.
            </td>
          </tr>
          <tr>
            <td>
              <code>scale</code>
            </td>
            <td>1.0</td>
            <td>Zoom multiplier for the whole skin. Clamped 0.25–4.0.</td>
          </tr>
          <tr>
            <td>
              <code>fps</code>
            </td>
            <td>10</td>
            <td>Sprite-sheet playback rate. Clamped 1–60. GIFs use their own timing.</td>
          </tr>
          <tr>
            <td>
              <code>emptyFrames</code> / <code>fullFrames</code> / <code>mutedFrames</code>
            </td>
            <td>1</td>
            <td>
              Frame count of that layer&apos;s vertical sprite sheet. The PNG&apos;s pixel height
              must divide by it exactly.
            </td>
          </tr>
          <tr>
            <td>
              <code>mutedDim</code>
            </td>
            <td>0.6</td>
            <td>
              Opacity the empty layer drops to when muted, if there is no <code>muted.png</code>.
              Clamped 0–1.
            </td>
          </tr>
          <tr>
            <td>
              <code>percentText</code>
            </td>
            <td>hidden</td>
            <td>The percentage number. Omit the object entirely to hide it.</td>
          </tr>
        </tbody>
      </table>

      <h3 id="percent-text">percentText</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Default</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>show</code>
            </td>
            <td>false</td>
            <td>Whether the number is drawn at all.</td>
          </tr>
          <tr>
            <td>
              <code>x</code>, <code>y</code>
            </td>
            <td>0, 0</td>
            <td>
              Image-pixel position. <code>y</code> is the top of the text; <code>x</code> is the
              anchor, which <code>align</code> interprets.
            </td>
          </tr>
          <tr>
            <td>
              <code>align</code>
            </td>
            <td>left</td>
            <td>
              <code>left</code>, <code>center</code> or <code>right</code>. Decides whether{" "}
              <code>x</code> is the text&apos;s left edge, centre or right edge — so a
              centre-anchored number stays put as it goes from 9 to 100.
            </td>
          </tr>
          <tr>
            <td>
              <code>color</code>
            </td>
            <td>#FFFFFFFF</td>
            <td>
              <code>#AARRGGBB</code> or <code>#RRGGBB</code>. Alpha leads, unlike CSS.
            </td>
          </tr>
          <tr>
            <td>
              <code>fontFamily</code>
            </td>
            <td>Segoe UI</td>
            <td>Any font installed on the machine showing the skin.</td>
          </tr>
          <tr>
            <td>
              <code>fontSize</code>
            </td>
            <td>14</td>
            <td>In image pixels, so it scales with the skin. Clamped 4–200.</td>
          </tr>
          <tr>
            <td>
              <code>bold</code>
            </td>
            <td>false</td>
            <td>Bold instead of the default semibold.</td>
          </tr>
          <tr>
            <td>
              <code>outlineColor</code> / <code>outlineWidth</code>
            </td>
            <td>none / 0</td>
            <td>
              A real stroke around the glyphs. Omit the colour for no outline. Width clamped
              0–20.
            </td>
          </tr>
          <tr>
            <td>
              <code>shadowColor</code> / <code>shadowBlur</code> / <code>shadowDepth</code>
            </td>
            <td>none / 4 / 2
            </td>
            <td>
              Drop shadow, cast down and to the right. Omit the colour for no shadow. Blur and
              depth clamped 0–50.
            </td>
          </tr>
        </tbody>
      </table>

      <CodeBlock label={`${skin.id}/skin.json — the skin above`}>
        {JSON.stringify(
          {
            percentText: {
              show: true,
              x: skin.config.text?.x,
              y: skin.config.text?.y,
              color: skin.config.text?.color,
              fontSize: skin.config.text?.fontSize,
              bold: skin.config.text?.bold,
              outlineColor: skin.config.text?.outlineColor,
              outlineWidth: skin.config.text?.outlineWidth,
              align: skin.config.text?.align,
            },
            scale: skin.config.scale,
            fps: skin.config.fps,
            emptyFrames: skin.config.emptyFrames,
            fullFrames: skin.config.fullFrames,
            mutedDim: skin.config.mutedDim,
            fillStartX: skin.config.fillStartX,
            fillEndX: skin.config.fillEndX,
          },
          null,
          2,
        )}
      </CodeBlock>

      <h2 id="metadata">Credits</h2>
      <p>
        Since v3.2 the skin designer writes an optional metadata block into the same{" "}
        <code>skin.json</code>, so a skin can say who made it without a readme travelling beside
        it. Every field here is optional and every one of them is absent by default: a skin
        written before v3.2 carries none, loads identically, and is not deprecated by this.
        Filling them in changes nothing about how the OSD draws.
      </p>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Limit</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>title</code>
            </td>
            <td>{MAX_TITLE_LENGTH} characters</td>
            <td>
              The display name, distinct from the folder name. Absent means the folder name is
              the name.
            </td>
          </tr>
          <tr>
            <td>
              <code>author</code>
            </td>
            <td>{MAX_AUTHOR_LENGTH} characters</td>
            <td>Who made it. Absent means the skin is credited to nobody, not to the host.</td>
          </tr>
          <tr>
            <td>
              <code>description</code>
            </td>
            <td>{MAX_DESCRIPTION_LENGTH} characters</td>
            <td>A sentence or two about the skin. Line breaks are kept.</td>
          </tr>
          <tr>
            <td>
              <code>version</code>
            </td>
            <td>{MAX_VERSION_LENGTH} characters</td>
            <td>
              The author&apos;s own version string for their artwork —{" "}
              <code>&quot;2&quot;</code>, <code>&quot;2026-02&quot;</code>. A string, never
              parsed as a number and never compared against the app&apos;s version.
            </td>
          </tr>
          <tr>
            <td>
              <code>tags</code>
            </td>
            <td>
              {MAX_TAGS} tags, {MAX_TAG_LENGTH} characters each
            </td>
            <td>
              An array of strings. De-duplicated case-insensitively with the first spelling kept;
              anything past the {MAX_TAGS}
              th is dropped.
            </td>
          </tr>
          <tr>
            <td>
              <code>sourceUrl</code>
            </td>
            <td>{MAX_SOURCE_URL_LENGTH} characters</td>
            <td>
              Where the skin came from. Absolute <code>https</code> only, with no credentials in
              it; anything else is dropped rather than linked, and a URL over the limit is
              dropped whole rather than truncated into a different destination.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        These are credits, not configuration, so they never fail a skin. A field of the wrong
        type or a value that cannot be used is ignored and the rest of the skin loads — unlike
        the rendering fields above, where a malformed <code>skin.json</code> fails the whole
        skin. Text is trimmed, capped and stripped of the control and bidi-override characters
        that let a credit render as something other than what it says.
      </p>

      <CodeBlock label="skin.json — the credits keys, in the same file as the rendering ones">
        {`{
  "title": "Midnight bar",
  "author": "your name here",
  "description": "A narrow bar with a soft glow, sized for a 1080p screen.",
  "version": "2",
  "tags": ["bar", "dark", "minimal"],
  "sourceUrl": "https://example.com/skins/midnight-bar",

  "percentText": { "show": true, "x": 120, "y": 8, "align": "center" },
  "fillStartX": 12,
  "fillEndX": 228
}`}
      </CodeBlock>

      <p>
        Where they show up: the app&apos;s skin picker lists the title, the author and the
        description instead of a bare folder name, and a{" "}
        <Link href="/gallery">gallery</Link> card takes its byline, blurb, tags and version
        straight from the skin — linking the author&apos;s name at <code>sourceUrl</code> when
        there is one. A listing here only names those fields itself to override the skin or to
        fill a gap, so a skin that credits itself is credited by its author rather than by
        whoever committed the entry.
      </p>
      <p>
        <strong>Export…</strong> also writes a <code>preview.png</code> into the zip, rendered
        from the skin at export time. It is generated, not authored: import ignores it, and
        deleting it costs nothing.
      </p>
      <p>
        The full schema, including every default the app applies, is in the desktop
        repository&apos;s{" "}
        <a href={REFERENCE_URL}>reference.md</a>.
      </p>

      <h2 id="animation">Animated layers</h2>
      <p>There are three ways to animate a layer, and they behave identically once loaded.</p>
      <ul>
        <li>
          <strong>GIF.</strong> Name the file <code>empty.gif</code> or <code>full.gif</code>.
          Frame timing comes from the GIF. Note that GIF transparency is 1-bit: hard edges, no
          soft shadows.
        </li>
        <li>
          <strong>Sprite-sheet PNG.</strong> Stack equal-height frames vertically in one PNG and
          declare <code>emptyFrames</code>/<code>fullFrames</code> plus <code>fps</code>. Full
          8-bit alpha.
        </li>
        <li>
          <strong>PNG frame sequence.</strong> In the skin designer, click <strong>Frames…</strong>{" "}
          and multi-select exported frames; the sheet is assembled for you.
        </li>
      </ul>
      <p>
        Layers animate independently and loop, and mixing a static layer with an animated one is
        fine. Animation only runs while the OSD is on screen. APNG is not supported — WPF has no
        decoder for it, so use a sprite sheet when you need full alpha.
      </p>

      <h2 id="muted">The muted layer</h2>
      <p>
        Without <code>muted.png</code>, mute dims the empty layer to <code>mutedDim</code> and
        shows a small badge. With it, that artwork is shown on its own — no dim, no badge — and
        it must be the same frame size as the other layers.
      </p>

      <h2 id="failures">What makes a skin fail</h2>
      <ul>
        <li>Missing <code>empty</code> or <code>full</code> layer, in either extension.</li>
        <li>The two layers&apos; frame sizes disagreeing.</li>
        <li>
          A sprite sheet whose pixel height does not divide evenly by its declared frame count.
        </li>
        <li>
          <code>fillStartX</code> greater than or equal to <code>fillEndX</code> after clamping.
        </li>
        <li>Malformed <code>skin.json</code>. The whole skin fails rather than partly applying.</li>
      </ul>
      <p>
        In every case the app falls back to the Dark pill style and warns from the tray. There is
        a log in <code>%APPDATA%\AorinEQ\</code> if you need to see why.
      </p>

      <h2 id="sharing">Sharing</h2>
      <p>
        <strong>Export…</strong> in the skin designer writes a zip containing exactly the known
        skin files at the archive root. Import takes them by name, never by the path inside the
        archive, so a hostile entry cannot escape the skins folder. Zips are capped at 20 MB.
      </p>
      <p>
        Host the zip anywhere that serves it over https, then turn it into a one-click button
        with the <Link href="/tools/skin-link">install-link builder</Link>, or read the{" "}
        <Link href="/docs/protocol">protocol contract</Link> to generate links yourself.
      </p>
    </>
  );
}
