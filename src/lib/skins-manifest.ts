/**
 * The gallery manifest: validation and the shape the pages consume.
 *
 * V1 has no database and no uploads. A skin is in the gallery because its files are committed
 * to this repo and its entry is in `src/data/skins.json`. Validation is strict and throws,
 * because a malformed entry should fail the build rather than ship a gallery card whose
 * install link points nowhere.
 */

import type { SkinConfig } from "./skin";
import type { SkinMeta } from "./skin-meta";

/** Where the artwork came from — shown on the card, and the basis of the takedown posture. */
export type SkinOrigin = "original" | "fan-art" | "commissioned";

/** The facts only this site knows: where the files live and how the listing is governed. */
export interface SkinIdentity {
  /** URL slug and default install name; also the folder under `public/`. */
  id: string;
  origin: SkinOrigin;
  /** The folder name AorinEQ installs the skin as. */
  installName: string;
  /** Path under `public/` holding empty.png, full.png and skin.json. No leading slash. */
  directory: string;
  /** Path under `public/` to the shareable zip. No leading slash. */
  zip: string;
  credit?: string;
}

/**
 * One entry in `src/data/skins.json`.
 *
 * The descriptive fields are OPTIONAL here because a skin can carry them itself: `skin.json`
 * has title/author/description/tags/version/sourceUrl keys that the author fills in from the
 * app's designer. Repeating those in the manifest would mean two spellings of one fact, and the
 * one that drifts is the one nobody edits. An entry names them only to override or to fill a
 * gap — see {@link resolveListing}.
 */
export interface SkinManifestEntry extends SkinIdentity {
  title?: string;
  author?: string;
  authorUrl?: string;
  description?: string;
  tags?: string[];
}

/** The copy a card shows, after the manifest and the skin's own metadata have been merged. */
export interface SkinListing {
  title: string;
  author: string;
  authorUrl?: string;
  description: string;
  tags: string[];
  /** The author's own version string, from `skin.json` only. Null when the skin declares none. */
  version: string | null;
}

/** A manifest entry once its files have been read: real pixel size, real config, real digest. */
export interface GallerySkin extends SkinIdentity, SkinListing {
  width: number;
  height: number;
  config: SkinConfig;
  /** SHA-256 of the zip exactly as served, so the install link can pin it. */
  sha256: string;
  zipBytes: number;
  emptyUrl: string;
  fullUrl: string;
  /** The optional muted-state layer, or null when the skin ships none. */
  mutedUrl: string | null;
  zipUrl: string;
}

const ORIGINS: SkinOrigin[] = ["original", "fan-art", "commissioned"];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function requireString(value: unknown, field: string, id: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Skin manifest entry "${id}": ${field} must be a non-empty string.`);
  }
  return value.trim();
}

/** An overridable field: absent is fine, but present-and-blank is a typo worth failing on. */
function optionalString(value: unknown, field: string, id: string): string | undefined {
  return value === undefined ? undefined : requireString(value, field, id);
}

function requireRelativePath(value: unknown, field: string, id: string): string {
  const path = requireString(value, field, id);
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) {
    throw new Error(
      `Skin manifest entry "${id}": ${field} must be a relative path under public/ without ".." segments.`,
    );
  }
  return path;
}

/** Validates one raw manifest entry. Throws with the offending field named. */
export function parseManifestEntry(raw: unknown): SkinManifestEntry {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Skin manifest entries must be objects.");
  }
  const entry = raw as Record<string, unknown>;
  const id = typeof entry.id === "string" ? entry.id : "<missing id>";
  if (!ID_PATTERN.test(id)) {
    throw new Error(
      `Skin manifest entry "${id}": id must be lowercase words joined by single hyphens.`,
    );
  }
  const origin = entry.origin;
  if (typeof origin !== "string" || !ORIGINS.includes(origin as SkinOrigin)) {
    throw new Error(
      `Skin manifest entry "${id}": origin must be one of ${ORIGINS.join(", ")}.`,
    );
  }
  const tags = entry.tags;
  if (
    tags !== undefined &&
    (!Array.isArray(tags) || tags.length === 0 || tags.some((t) => typeof t !== "string"))
  ) {
    throw new Error(`Skin manifest entry "${id}": tags must be a non-empty array of strings.`);
  }

  return {
    id,
    title: optionalString(entry.title, "title", id),
    author: optionalString(entry.author, "author", id),
    authorUrl: typeof entry.authorUrl === "string" ? entry.authorUrl : undefined,
    origin: origin as SkinOrigin,
    description: optionalString(entry.description, "description", id),
    tags: tags === undefined ? undefined : (tags as string[]).map((t) => t.trim()),
    installName: requireString(entry.installName, "installName", id),
    directory: requireRelativePath(entry.directory, "directory", id),
    zip: requireRelativePath(entry.zip, "zip", id),
    credit: typeof entry.credit === "string" ? entry.credit : undefined,
  };
}

function required<T>(value: T | null | undefined, field: string, id: string): T {
  if (value === null || value === undefined) {
    throw new Error(
      `Skin "${id}": ${field} is in neither the manifest entry nor the skin's own skin.json.`,
    );
  }
  return value;
}

/**
 * Merges a manifest entry over the skin's own metadata into the copy a card shows.
 *
 * The manifest wins where it speaks, because a person reviewed those words before the skin was
 * listed. Everything it leaves out comes from `skin.json`, so a skin that credits itself is
 * credited by its own author rather than by whoever committed the entry. `version` has no
 * manifest spelling at all: it is the author's statement about their own work.
 *
 * A field that neither source supplies is a listing that cannot be rendered honestly, so it
 * throws and fails the build rather than shipping a card with a blank byline.
 */
export function resolveListing(entry: SkinManifestEntry, meta: SkinMeta): SkinListing {
  const tags = entry.tags ?? (meta.tags.length > 0 ? meta.tags : undefined);
  return {
    title: required(entry.title ?? meta.title, "title", entry.id),
    author: required(entry.author ?? meta.author, "author", entry.id),
    authorUrl: entry.authorUrl ?? meta.sourceUrl ?? undefined,
    description: required(entry.description ?? meta.description, "description", entry.id),
    tags: required(tags, "tags", entry.id),
    version: meta.version,
  };
}

/** Validates a whole manifest document and rejects duplicate ids. */
export function parseManifest(raw: unknown): SkinManifestEntry[] {
  const doc = raw as { skins?: unknown };
  if (!doc || !Array.isArray(doc.skins)) {
    throw new Error('Skin manifest must be an object with a "skins" array.');
  }
  const entries = doc.skins.map(parseManifestEntry);
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      throw new Error(`Skin manifest has two entries with id "${entry.id}".`);
    }
    seen.add(entry.id);
  }
  return entries;
}

/** How an origin is labelled on a card. */
export function originLabel(origin: SkinOrigin): string {
  switch (origin) {
    case "original":
      return "Original artwork";
    case "fan-art":
      return "Fan art";
    case "commissioned":
      return "Commissioned";
  }
}
