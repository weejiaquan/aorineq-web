import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/CodeBlock";
import { SkinPlayer } from "@/components/SkinPlayer";
import { loadHeroSkin } from "@/lib/skins-server";

export const metadata: Metadata = {
  title: "Skin format",
  description:
    "Every skin.json field: the fill range, percent text styling, sprite sheets, GIF layers and the muted layer — plus what makes a skin fail to load.",
};

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
