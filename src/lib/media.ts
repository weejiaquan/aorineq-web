import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { readGifSize } from "./gif";

/**
 * The demo captures of the desktop app, served from this repo.
 *
 * They are VENDORED under `public/media/`, not hotlinked from the app's repository. A raw
 * githubusercontent URL answers `cache-control: max-age=300` and is not an asset host: every
 * visitor would pay a third-party round trip for artwork this site's own edge already caches
 * forever, and a rename or a force-push on the other repo's master would blank the page here
 * with nothing in this repo's history to explain it. The cost of vendoring is ~3 MB of binaries
 * and the risk that a refreshed capture is forgotten; the test beside this file pins each file's
 * real size and dimensions so a stale or truncated copy fails the suite rather than the layout.
 *
 * Refresh with, from the repo root:
 *   curl -sfL -o public/media/<id>.gif \
 *     https://raw.githubusercontent.com/weejiaquan/aorineq/master/docs/media/<id>.gif
 *
 * `alt` is what the capture shows, for someone who cannot see it. `caption` is printed under it
 * and says where it came from, so the two are not the same sentence read twice.
 */
export interface Capture {
  /** Also the filename under `public/media/`. */
  id: string;
  alt: string;
  caption: string;
}

export const CAPTURES: readonly Capture[] = [
  {
    id: "skin-designer",
    alt:
      "The AorinEQ skin designer: the fill slider scrubbed from one end of the bar to the other, " +
      "the muted state previewed, then the percent-text options scrolled into view.",
    caption: "The skin designer, recorded from the app's own window.",
  },
  {
    id: "eq-editor",
    alt:
      "The AorinEQ equalizer editor: a band node dragged down the response curve while the curve, " +
      "the band strip's numbers and the input and output meters follow it.",
    caption: "The equalizer editor, recorded from the app's own window.",
  },
  {
    id: "osd-demo",
    alt:
      "The on-screen display sweeping from 20% to 100% and back down to 4%, its percent number " +
      "staying centred as the digits change, then the same skin's muted layer.",
    caption: "The skinned on-screen display, recorded from the app's own window.",
  },
];

/** A capture once its file has been read: real pixel size, real byte count. */
export interface LoadedCapture extends Capture {
  /** Path under `public/`, with the leading slash a `src` needs. */
  src: string;
  width: number;
  height: number;
  bytes: number;
}

const MEDIA_DIR = path.join(process.cwd(), "public", "media");

const cache = new Map<string, Promise<LoadedCapture>>();

/**
 * Reads one capture's real dimensions and weight off disk, at build time.
 *
 * Nothing about a capture is declared twice: the box reserved on the page and the size printed
 * on a click-to-play control both come from the bytes this site serves.
 */
export function loadCapture(id: string): Promise<LoadedCapture> {
  const existing = cache.get(id);
  if (existing) return existing;

  const capture = CAPTURES.find((item) => item.id === id);
  if (!capture) throw new Error(`No capture is declared with id "${id}".`);

  const loading = (async (): Promise<LoadedCapture> => {
    const bytes = await readFile(path.join(MEDIA_DIR, `${id}.gif`));
    const size = readGifSize(bytes);
    if (size === null) throw new Error(`Capture "${id}": public/media/${id}.gif is not a GIF.`);
    return { ...capture, src: `/media/${id}.gif`, ...size, bytes: bytes.byteLength };
  })();

  cache.set(id, loading);
  return loading;
}
