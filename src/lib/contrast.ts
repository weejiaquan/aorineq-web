/**
 * WCAG 2.1 relative-luminance contrast, plus the palette pairings this site promises to keep.
 *
 * The desktop project shipped a 1.41:1 text bug once. The list below is the contract the test
 * suite checks against the real values in `globals.css`, so a palette edit that breaks a
 * pairing fails the build rather than the reader.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parses `#rgb`, `#rrggbb` or `#rrggbbaa` (alpha ignored — contrast needs a composited pair). */
export function parseHex(value: string): Rgb {
  const hex = value.trim().replace(/^#/, "");
  const expand = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(expand)) {
    throw new Error(`Not a hex colour: ${value}`);
  }
  return {
    r: parseInt(expand.slice(0, 2), 16),
    g: parseInt(expand.slice(2, 4), 16),
    b: parseInt(expand.slice(4, 6), 16),
  };
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. */
export function luminance(color: Rgb): number {
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

/** Contrast ratio between two opaque colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(parseHex(a));
  const lb = luminance(parseHex(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Extracts `--name: value;` custom properties from a CSS source. */
export function readCssTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

export interface Pairing {
  /** Token name of the text colour. */
  foreground: string;
  /** Token name of the surface it sits on. */
  background: string;
  /** Minimum acceptable ratio: 4.5 for body text, 3 for large text and UI edges. */
  minimum: number;
  /** Where this pairing appears, so a failure names a real place on the site. */
  usedFor: string;
}

/**
 * Every foreground/background combination the site actually renders. Adding a colour pairing
 * to the UI means adding it here; the test refuses to pass a pairing that is not listed.
 */
export const TEXT_PAIRINGS: Pairing[] = [
  { foreground: "text", background: "ink", minimum: 4.5, usedFor: "body copy on the page ground" },
  { foreground: "text", background: "panel", minimum: 4.5, usedFor: "body copy inside panels" },
  { foreground: "text", background: "raised", minimum: 4.5, usedFor: "body copy on raised cards" },
  { foreground: "muted", background: "ink", minimum: 4.5, usedFor: "secondary copy and captions" },
  { foreground: "muted", background: "panel", minimum: 4.5, usedFor: "labels inside panels" },
  { foreground: "muted", background: "raised", minimum: 4.5, usedFor: "labels on raised cards" },
  { foreground: "amber", background: "ink", minimum: 4.5, usedFor: "links and section eyebrows" },
  { foreground: "amber", background: "panel", minimum: 4.5, usedFor: "readouts inside panels" },
  { foreground: "amber", background: "raised", minimum: 4.5, usedFor: "readouts on raised cards" },
  { foreground: "sand", background: "ink", minimum: 4.5, usedFor: "display headings" },
  { foreground: "sand", background: "panel", minimum: 4.5, usedFor: "panel headings" },
  { foreground: "mint", background: "ink", minimum: 4.5, usedFor: "verified/hash confirmations" },
  { foreground: "mint", background: "panel", minimum: 4.5, usedFor: "verified state inside panels" },
  { foreground: "rust", background: "ink", minimum: 4.5, usedFor: "validation errors, and the SmartScreen line under a compact download button" },
  { foreground: "rust", background: "panel", minimum: 4.5, usedFor: "validation errors in forms, and the SmartScreen heading beside the download" },
  { foreground: "ink", background: "amber", minimum: 4.5, usedFor: "the primary download button, including its platform/size sub-label" },
  { foreground: "line", background: "ink", minimum: 1.2, usedFor: "hairline rules (non-text)" },
];
