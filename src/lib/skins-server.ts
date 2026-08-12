import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { readPngSize } from "./png";
import { parseSkinConfig } from "./skin";
import { parseManifest, type GallerySkin } from "./skins-manifest";
import manifestJson from "@/data/skins.json";

/**
 * Reads the gallery manifest and everything it points at, at build time.
 *
 * Dimensions come from the PNG itself and the digest from the zip itself, so the numbers on a
 * card and the sha256 inside an install link can never drift from the bytes this site serves.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");

function publicPath(relative: string): string {
  return path.join(PUBLIC_DIR, ...relative.split("/"));
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

let cached: Promise<GallerySkin[]> | null = null;

export function loadGallerySkins(): Promise<GallerySkin[]> {
  cached ??= (async () => {
    const entries = parseManifest(manifestJson);
    return Promise.all(
      entries.map(async (entry): Promise<GallerySkin> => {
        const [emptyBytes, configText, zipBytes] = await Promise.all([
          readFile(publicPath(`${entry.directory}/empty.png`)),
          readFile(publicPath(`${entry.directory}/skin.json`), "utf8"),
          readFile(publicPath(entry.zip)),
        ]);

        const size = readPngSize(emptyBytes);
        if (size === null) {
          throw new Error(`Skin "${entry.id}": ${entry.directory}/empty.png is not a valid PNG.`);
        }
        const config = parseSkinConfig(JSON.parse(configText), size.width);

        return {
          ...entry,
          width: size.width,
          height: size.height,
          config,
          sha256: sha256Hex(zipBytes),
          zipBytes: zipBytes.byteLength,
          emptyUrl: `/${entry.directory}/empty.png`,
          fullUrl: `/${entry.directory}/full.png`,
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
