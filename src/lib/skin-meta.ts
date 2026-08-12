/**
 * The authorship metadata a `skin.json` can carry, ported from `src/AorinEQ.Core/SkinMeta.cs`.
 *
 * Every field is optional: a skin written before the app grew credits has none, and that is a
 * valid skin. What matters here is that these strings were typed by whoever made the skin and
 * are rendered on a public page, so they go through the app's own normalization — trimmed,
 * capped by text element, stripped of the control and bidi-override characters that let a
 * credit render as something other than what it says, and a `sourceUrl` that is not
 * credential-free https dropped rather than linked.
 *
 * A wrong TYPE is not an error. The app deserializes these as raw JSON elements precisely so
 * that `"title": 42` cannot fail a whole skin over a credit line, and this reader ignores
 * non-strings for the same reason.
 */

import { forDisplay, isDeceptive, validateDownloadUrl } from "./protocol";

/** Caps, counted in text elements. Sized for a credit line, not for prose. */
export const MAX_TITLE_LENGTH = 80;
export const MAX_AUTHOR_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_VERSION_LENGTH = 32;
export const MAX_TAG_LENGTH = 32;
export const MAX_TAGS = 12;
/** A URL past this is DROPPED, never truncated — half a URL is a different destination. */
export const MAX_SOURCE_URL_LENGTH = 512;

export interface SkinMeta {
  /** Display name, distinct from the folder name. Null = the folder name is the name. */
  title: string | null;
  /** Who made it. Null = anonymous, like every skin written before the app had credits. */
  author: string | null;
  /** A sentence or two about the skin. May contain newlines, only ever spelled `\n`. */
  description: string | null;
  /** The AUTHOR's version string for their skin ("1", "2024-03") — never parsed as a number. */
  version: string | null;
  /** Tags, de-duplicated case-insensitively with the first spelling kept. Never null. */
  tags: string[];
  /** Where the skin came from: absolute https, no credentials, or null. */
  sourceUrl: string | null;
}

/**
 * Trims, flattens the whitespace that would break a one-line credit, drops characters that
 * disguise how the text renders, and caps the length. Null when nothing meaningful is left.
 */
function clean(value: unknown, cap: number, keepNewlines: boolean): string | null {
  if (typeof value !== "string") return null;

  let out = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    // CRLF/CR/LF all normalize to a single \n first, so a description carries exactly one
    // line-ending spelling onto the page.
    if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && value[i + 1] === "\n") i++;
      out += keepNewlines ? "\n" : " ";
      continue;
    }
    if (ch === "\t") {
      out += " "; // a tab is separation, not a control code to delete
      continue;
    }
    if (isDeceptive(ch)) continue; // C0/C1 controls and the bidi overrides: dropped outright
    out += ch;
  }

  const cleaned = forDisplay(out.trim(), cap).trim();
  return cleaned.length === 0 ? null : cleaned;
}

function cleanTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const kept: string[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    const tag = clean(raw, MAX_TAG_LENGTH, false);
    if (tag === null) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue; // first spelling wins
    seen.add(key);
    kept.push(tag);
    if (kept.length === MAX_TAGS) break;
  }
  return kept;
}

/**
 * Keeps a source URL only when it clears the same bar a download URL does, because this one is
 * published as a link for other people to click. Kept verbatim: re-serializing it could rewrite
 * escaping the author chose.
 */
function cleanSourceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_SOURCE_URL_LENGTH) return null;
  if ([...trimmed].some(isDeceptive)) return null;
  return validateDownloadUrl(trimmed).ok ? trimmed : null;
}

/** Reads the metadata keys out of a parsed `skin.json`. Missing keys read as absent, not error. */
export function parseSkinMeta(raw: unknown): SkinMeta {
  const json = (raw ?? {}) as Record<string, unknown>;
  return {
    title: clean(json.title, MAX_TITLE_LENGTH, false),
    author: clean(json.author, MAX_AUTHOR_LENGTH, false),
    description: clean(json.description, MAX_DESCRIPTION_LENGTH, true),
    version: clean(json.version, MAX_VERSION_LENGTH, false),
    tags: cleanTags(json.tags),
    sourceUrl: cleanSourceUrl(json.sourceUrl),
  };
}
