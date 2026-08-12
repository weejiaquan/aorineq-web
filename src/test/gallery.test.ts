import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readPngSize } from "@/lib/png";
import { parseManifest, parseManifestEntry, originLabel } from "@/lib/skins-manifest";
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
