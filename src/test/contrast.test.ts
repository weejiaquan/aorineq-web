import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { TEXT_PAIRINGS, contrastRatio, luminance, parseHex, readCssTokens } from "@/lib/contrast";

/**
 * The palette is read out of the stylesheet that actually ships, not out of a copy kept for
 * the test. Tailwind names the tokens `--color-<name>`; the pairings name the colours the way
 * a person would.
 */
const CSS = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
const TOKENS = readCssTokens(CSS);

function colour(name: string): string {
  const value = TOKENS[`color-${name}`];
  if (!value) throw new Error(`globals.css has no --color-${name} token`);
  return value;
}

describe("the contrast checker itself", () => {
  it("gives white on black the maximum ratio", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("gives a colour against itself the minimum", () => {
    expect(contrastRatio("#7f7f7f", "#7f7f7f")).toBeCloseTo(1, 9);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#123456", "#abcdef")).toBeCloseTo(
      contrastRatio("#abcdef", "#123456"),
      9,
    );
  });

  it("would have caught the 1.41:1 bug this project shipped once", () => {
    // Mid grey on a slightly darker grey: legible to nobody, and a ratio the checker must fail.
    const ratio = contrastRatio("#8a8a8a", "#6f6f6f");
    expect(ratio).toBeGreaterThan(1.3);
    expect(ratio).toBeLessThan(1.6);
    expect(ratio).toBeLessThan(4.5);
  });

  it("expands shorthand hex and ignores a trailing alpha pair", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#0b0e13ff")).toEqual(parseHex("#0b0e13"));
  });

  it("refuses something that is not a colour", () => {
    expect(() => parseHex("rebeccapurple")).toThrow(/Not a hex colour/);
  });

  it("weights green far above blue, per WCAG", () => {
    expect(luminance(parseHex("#00ff00"))).toBeGreaterThan(luminance(parseHex("#0000ff")));
  });
});

describe("the palette in globals.css", () => {
  it("defines every token the pairings refer to", () => {
    for (const pairing of TEXT_PAIRINGS) {
      expect(() => colour(pairing.foreground)).not.toThrow();
      expect(() => colour(pairing.background)).not.toThrow();
    }
  });

  it.each(TEXT_PAIRINGS)(
    "$foreground on $background clears $minimum:1 — $usedFor",
    ({ foreground, background, minimum }) => {
      const ratio = contrastRatio(colour(foreground), colour(background));
      expect(
        ratio,
        `${foreground} (${colour(foreground)}) on ${background} (${colour(background)}) is ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(minimum);
    },
  );

  it("keeps the three surfaces distinguishable from each other", () => {
    expect(contrastRatio(colour("panel"), colour("ink"))).toBeGreaterThan(1.05);
    expect(contrastRatio(colour("raised"), colour("panel"))).toBeGreaterThan(1.05);
  });

  it("sources the accent from the seed skin's own percent-text colour", () => {
    // skin.json says "#FFFEC707" — alpha FF, then FE C7 07.
    expect(colour("amber").toLowerCase()).toBe("#fec707");
    expect(colour("sand").toLowerCase()).toBe("#f3cfab");
  });
});
