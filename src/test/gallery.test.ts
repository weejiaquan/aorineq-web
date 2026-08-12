import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readPngSize } from "@/lib/png";
import { parseSkinMeta } from "@/lib/skin-meta";
import {
  parseManifest,
  parseManifestEntry,
  originLabel,
  resolveListing,
} from "@/lib/skins-manifest";
import { loadGallerySkins } from "@/lib/skins-server";
import manifestJson from "@/data/skins.json";

/**
 * The gallery is only as trustworthy as the agreement between the manifest, the files in
 * public/, and the digest pinned into each install link. These tests check that agreement
 * against the real files rather than against fixtures.
 */

const VALID = {
  id: "neon-bar",
  title: "Neon bar",
  author: "someone",
  origin: "fan-art",
  description: "A bar.",
  tags: ["bar"],
  installName: "neon-bar",
  directory: "skins/neon-bar",
  zip: "skins/neon-bar.zip",
};

describe("parseManifestEntry", () => {
  it("accepts a complete entry", () => {
    expect(parseManifestEntry(VALID).id).toBe("neon-bar");
  });

  it("requires a slug-shaped id", () => {
    expect(() => parseManifestEntry({ ...VALID, id: "Neon Bar" })).toThrow(/lowercase words/);
    expect(() => parseManifestEntry({ ...VALID, id: "neon--bar" })).toThrow(/lowercase words/);
    expect(() => parseManifestEntry({ ...VALID, id: undefined })).toThrow(/<missing id>/);
  });

  it("requires a known origin, because the card states it as fact", () => {
    expect(() => parseManifestEntry({ ...VALID, origin: "borrowed" })).toThrow(/origin must be/);
  });

  it("requires at least one tag", () => {
    expect(() => parseManifestEntry({ ...VALID, tags: [] })).toThrow(/tags must be/);
    expect(() => parseManifestEntry({ ...VALID, tags: [1, 2] })).toThrow(/tags must be/);
  });

  it("requires the text fields to say something", () => {
    for (const field of ["title", "author", "description", "installName"]) {
      expect(() => parseManifestEntry({ ...VALID, [field]: "  " })).toThrow(
        new RegExp(`${field} must be a non-empty string`),
      );
    }
  });

  it("refuses paths that could escape public/", () => {
    expect(() => parseManifestEntry({ ...VALID, directory: "/etc" })).toThrow(/relative path/);
    expect(() => parseManifestEntry({ ...VALID, zip: "../../secrets.zip" })).toThrow(
      /relative path/,
    );
    expect(() => parseManifestEntry({ ...VALID, zip: "skins\\a.zip" })).toThrow(/relative path/);
  });

  it("rejects anything that is not an object", () => {
    expect(() => parseManifestEntry("neon-bar")).toThrow(/must be objects/);
    expect(() => parseManifestEntry(null)).toThrow(/must be objects/);
  });
});

describe("parseManifest", () => {
  it("reads the manifest committed to this repository", () => {
    const entries = parseManifest(manifestJson);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.map((e) => e.id)).toContain("seia-bar-shadow");
  });

  it("requires a skins array", () => {
    expect(() => parseManifest({})).toThrow(/"skins" array/);
    expect(() => parseManifest(null)).toThrow(/"skins" array/);
  });

  it("refuses duplicate ids, which would collide as anchors and install names", () => {
    expect(() => parseManifest({ skins: [VALID, VALID] })).toThrow(/two entries with id/);
  });
});

/** Everything a skin can say about itself, so a test can remove one field at a time. */
const FULL_META = {
  title: "mika bar",
  author: "lychwee",
  description: "A pink bar.",
  version: "1",
  tags: ["pink", "bar"],
  sourceUrl: "https://example.com/mika",
};

describe("resolveListing", () => {
  const ENTRY = parseManifestEntry({ ...VALID, authorUrl: "https://example.com/someone" });
  const BARE = parseManifestEntry({
    id: "mika-bar",
    origin: "original",
    installName: "mika-bar",
    directory: "skins/mika-bar",
    zip: "skins/mika-bar.zip",
  });
  const META = parseSkinMeta(FULL_META);

  it("credits the skin from its own skin.json when the manifest says nothing", () => {
    expect(resolveListing(BARE, META)).toEqual({
      title: "mika bar",
      author: "lychwee",
      authorUrl: "https://example.com/mika",
      description: "A pink bar.",
      tags: ["pink", "bar"],
      version: "1",
    });
  });

  it("lets the manifest override, because a person reviewed those words", () => {
    const listing = resolveListing(ENTRY, META);
    expect(listing.title).toBe("Neon bar");
    expect(listing.author).toBe("someone");
    expect(listing.description).toBe("A bar.");
    expect(listing.tags).toEqual(["bar"]);
  });

  it("fills only the gaps, field by field", () => {
    const entry = parseManifestEntry({ ...VALID, id: "mika-bar", title: undefined });
    const listing = resolveListing(entry, META);
    expect(listing.title).toBe("mika bar"); // from the skin
    expect(listing.author).toBe("someone"); // from the manifest
  });

  it("takes the version from the skin only — it is the author's claim about their work", () => {
    expect(resolveListing(ENTRY, parseSkinMeta({})).version).toBeNull();
    expect(resolveListing(ENTRY, META).version).toBe("1");
  });

  it("falls back to the skin's own sourceUrl for the byline link", () => {
    expect(resolveListing(ENTRY, META).authorUrl).toBe("https://example.com/someone");
    expect(resolveListing(BARE, META).authorUrl).toBe("https://example.com/mika");
    const noSource = parseSkinMeta({ ...FULL_META, sourceUrl: undefined });
    expect(resolveListing(BARE, noSource).authorUrl).toBeUndefined();
  });

  it("refuses to render a card whose copy neither source supplies", () => {
    for (const field of ["title", "author", "description", "tags"] as const) {
      const partial = parseSkinMeta({ ...FULL_META, [field]: undefined });
      expect(() => resolveListing(BARE, partial), field).toThrow(
        new RegExp(`${field} is in neither the manifest entry nor`),
      );
    }
  });
});

describe("originLabel", () => {
  it("labels each origin the way the card shows it", () => {
    expect(originLabel("original")).toBe("Original artwork");
    expect(originLabel("fan-art")).toBe("Fan art");
    expect(originLabel("commissioned")).toBe("Commissioned");
  });
});

describe("loadGallerySkins", () => {
  it("loads every manifest entry with its real files", async () => {
    const skins = await loadGallerySkins();
    expect(skins.length).toBe(parseManifest(manifestJson).length);
    for (const skin of skins) {
      expect(skin.width).toBeGreaterThan(0);
      expect(skin.height).toBeGreaterThan(0);
      expect(skin.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(skin.zipBytes).toBeGreaterThan(0);
      expect(skin.emptyUrl.startsWith("/")).toBe(true);
      expect(skin.config.fillStartX).toBeLessThan(skin.config.fillEndX);
      expect(skin.config.fillEndX).toBeLessThanOrEqual(skin.width);
    }
  });

  it("takes the seed skin's numbers from the artwork, not from the manifest", async () => {
    const [seia] = (await loadGallerySkins()).filter((s) => s.id === "seia-bar-shadow");
    expect(seia.width).toBe(1500);
    expect(seia.height).toBe(750);
    expect(seia.config.fillStartX).toBe(325);
    expect(seia.config.fillEndX).toBe(1182);
    expect(seia.config.scale).toBe(0.35);
    expect(seia.config.text?.show).toBe(true);
    expect(seia.config.text?.align).toBe("center");
    expect(seia.config.text?.color).toBe("#FFFEC707");
  });

  it("credits mika-bar from the skin's own skin.json, not from the manifest", async () => {
    const [mika] = (await loadGallerySkins()).filter((s) => s.id === "mika-bar");
    const entry = parseManifest(manifestJson).find((e) => e.id === "mika-bar")!;
    // The manifest deliberately does not spell these; the card would be crediting the person
    // who committed the entry rather than the person who drew the skin.
    expect(entry.title).toBeUndefined();
    expect(entry.author).toBeUndefined();
    expect(mika.title).toBe("mika bar");
    expect(mika.author).toBe("lychwee");
    expect(mika.version).toBe("1");
  });

  it("takes mika-bar's numbers from the artwork it ships", async () => {
    const [mika] = (await loadGallerySkins()).filter((s) => s.id === "mika-bar");
    expect(mika.width).toBe(1672);
    expect(mika.height).toBe(941);
    expect(mika.config.fillStartX).toBe(427);
    expect(mika.config.fillEndX).toBe(1249);
    expect(mika.config.scale).toBe(0.3);
    expect(mika.config.text?.show).toBe(true);
    expect(mika.config.text?.align).toBe("center");
    expect(mika.config.text?.x).toBe(1375);
    expect(mika.config.text?.fontFamily).toBe("Calibri");
    expect(mika.config.text?.fontSize).toBe(80);
  });

  it("offers the muted layer only for the skin that ships one", async () => {
    const skins = await loadGallerySkins();
    const mika = skins.find((s) => s.id === "mika-bar")!;
    const seia = skins.find((s) => s.id === "seia-bar-shadow")!;
    expect(mika.mutedUrl).toBe("/skins/mika-bar/muted.png");
    expect(seia.mutedUrl).toBeNull();
  });

  it("serves every URL a card renders from a file that exists", async () => {
    for (const skin of await loadGallerySkins()) {
      const urls = [skin.emptyUrl, skin.fullUrl, skin.zipUrl, skin.mutedUrl].filter(
        (u): u is string => u !== null,
      );
      for (const url of urls) {
        const file = path.join(process.cwd(), "public", ...url.slice(1).split("/"));
        await expect(readFile(file), `${skin.id}: ${url}`).resolves.toBeDefined();
      }
    }
  });

  it("gives every layer of every skin the same frame size, which the app requires", async () => {
    for (const skin of await loadGallerySkins()) {
      const layers = [skin.emptyUrl, skin.fullUrl, skin.mutedUrl].filter(
        (u): u is string => u !== null,
      );
      for (const url of layers) {
        const bytes = await readFile(path.join(process.cwd(), "public", ...url.slice(1).split("/")));
        expect(readPngSize(bytes), `${skin.id}: ${url}`).toEqual({
          width: skin.width,
          height: skin.height,
        });
      }
    }
  });

  it("pins a digest that matches the zip this site actually serves", async () => {
    for (const skin of await loadGallerySkins()) {
      const bytes = await readFile(path.join(process.cwd(), "public", ...skin.zip.split("/")));
      expect(skin.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
      expect(skin.zipBytes).toBe(bytes.byteLength);
    }
  });

  it("serves the same fill range in the zip as on the card", async () => {
    // The zip is what a person installs; the card previews the loose files. If those two
    // disagreed the preview would be a lie, so the loose skin.json has to be the one shipped.
    for (const skin of await loadGallerySkins()) {
      const raw = await readFile(
        path.join(process.cwd(), "public", ...skin.directory.split("/"), "skin.json"),
        "utf8",
      );
      const parsed = JSON.parse(raw) as { fillStartX?: number; fillEndX?: number };
      expect(parsed.fillStartX ?? 0).toBe(skin.config.fillStartX);
      expect(parsed.fillEndX ?? skin.width).toBe(skin.config.fillEndX);
    }
  });
});

describe("readPngSize", () => {
  it("reads the IHDR of a real skin layer", async () => {
    const bytes = await readFile(
      path.join(process.cwd(), "public", "skins", "seia-bar-shadow", "empty.png"),
    );
    expect(readPngSize(bytes)).toEqual({ width: 1500, height: 750 });
  });

  it("gives both layers the same frame size, which the app requires", async () => {
    const dir = path.join(process.cwd(), "public", "skins", "seia-bar-shadow");
    const empty = readPngSize(await readFile(path.join(dir, "empty.png")));
    const full = readPngSize(await readFile(path.join(dir, "full.png")));
    expect(full).toEqual(empty);
  });

  it("returns null for bytes that are not a PNG", () => {
    expect(readPngSize(new Uint8Array(0))).toBeNull();
    expect(readPngSize(new Uint8Array(64))).toBeNull();
    expect(readPngSize(new TextEncoder().encode("GIF89a" + "x".repeat(40)))).toBeNull();
  });

  it("returns null when the first chunk is not IHDR", () => {
    const bytes = new Uint8Array(32);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x49, 0x44, 0x41, 0x54], 12); // IDAT
    expect(readPngSize(bytes)).toBeNull();
  });
});
