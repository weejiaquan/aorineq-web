import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { readPngSize } from "./png";
import { parseSkinConfig } from "./skin";
import { parseSkinMeta } from "./skin-meta";
import { parseManifest, resolveListing, type GallerySkin } from "./skins-manifest";
import manifestJson from "@/data/skins.json";

/**
 * Reads the gallery manifest and everything it points at, at build time.
 *
 * Dimensions come from the PNG itself, the credits and the render config from the skin's own
 * skin.json, and the digest from the zip itself — so the numbers on a card, the byline, and the
 * sha256 inside an install link can never drift from the bytes this site serves.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");

function publicPath(relative: string): string {
  return path.join(PUBLIC_DIR, ...relative.split("/"));
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

interface LayerSize {
  width: number;
  height: number;
}

async function readLayerSize(relative: string, id: string): Promise<LayerSize> {
  const size = readPngSize(await readFile(publicPath(relative)));
  if (size === null) throw new Error(`Skin "${id}": ${relative} is not a valid PNG.`);
  return size;
}

/**
 * The size of a layer a skin may or may not ship, or null when it ships none.
 *
 * Only `muted.png` is optional, and only `.png` is looked for: the app also accepts animated
 * `.gif` layers, but this site addresses `empty.png`/`full.png` by name too, and a preview that
 * supported GIF for one layer and not the others would render skins the OSD renders differently.
 */
async function readOptionalLayerSize(relative: string, id: string): Promise<LayerSize | null> {
  try {
    return await readLayerSize(relative, id);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function requireSameSize(a: LayerSize, b: LayerSize, what: string, id: string): void {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `Skin "${id}": ${what} is ${b.width}×${b.height} but empty.png is ${a.width}×${a.height}; ` +
        "the app requires every layer to share one frame size.",
    );
  }
}

let cached: Promise<GallerySkin[]> | null = null;

export function loadGallerySkins(): Promise<GallerySkin[]> {
  cached ??= (async () => {
    const entries = parseManifest(manifestJson);
    return Promise.all(
      entries.map(async (entry): Promise<GallerySkin> => {
        const dir = entry.directory;
        const [empty, full, mutedSize, configText, zipBytes] = await Promise.all([
          readLayerSize(`${dir}/empty.png`, entry.id),
          readLayerSize(`${dir}/full.png`, entry.id),
          readOptionalLayerSize(`${dir}/muted.png`, entry.id),
          readFile(publicPath(`${dir}/skin.json`), "utf8"),
          readFile(publicPath(entry.zip)),
        ]);

        requireSameSize(empty, full, "full.png", entry.id);
        if (mutedSize) requireSameSize(empty, mutedSize, "muted.png", entry.id);

        const json: unknown = JSON.parse(configText);

        return {
          ...entry,
          ...resolveListing(entry, parseSkinMeta(json)),
          width: empty.width,
          height: empty.height,
          config: parseSkinConfig(json, empty.width),
          sha256: sha256Hex(zipBytes),
          zipBytes: zipBytes.byteLength,
          emptyUrl: `/${dir}/empty.png`,
          fullUrl: `/${dir}/full.png`,
          mutedUrl: mutedSize ? `/${dir}/muted.png` : null,
          zipUrl: `/${entry.zip}`,
        };
      }),
    );
  })();
  return cached;
}

/** The skin the landing hero renders — the first entry in the manifest. */
export async function loadHeroSkin(): Promise<GallerySkin> {
  const skins = await loadGallerySkins();
  if (skins.length === 0) throw new Error("The skin manifest is empty; the hero needs one skin.");
  return skins[0];
}
