import { describe, expect, it } from "vitest";

import type { EqBand } from "@/lib/eq";
import {
  MAX_FREQUENCY,
  MIN_FREQUENCY,
  coefficients,
  logFrequencies,
  magnitudeDb,
  responseDb,
  suggestPreampDb,
} from "@/lib/eq-response";

/**
 * The checks below are against properties of the filters themselves rather than against
 * remembered numbers: a peaking filter hits its gain at its centre frequency, a shelf reaches
 * its gain in its own half of the spectrum, a notch kills its frequency. If the coefficients
 * were mistyped, these fail.
 */

function dbAt(band: EqBand, freq: number): number {
  return magnitudeDb(coefficients(band), freq);
}

describe("logFrequencies", () => {
  it("spans the range inclusively", () => {
    const freqs = logFrequencies(64);
    expect(freqs).toHaveLength(64);
    expect(freqs[0]).toBeCloseTo(MIN_FREQUENCY, 9);
    expect(freqs[63]).toBeCloseTo(MAX_FREQUENCY, 6);
  });

  it("is geometric, not linear", () => {
    const freqs = logFrequencies(5, 10, 100000);
    expect(freqs).toEqual([10, 100, 1000, 10000, 100000].map((f) => expect.closeTo(f, 6)));
  });

  it("refuses a grid too small to have two ends", () => {
    expect(() => logFrequencies(1)).toThrow(RangeError);
  });
});

describe("peaking filter", () => {
  it("reaches exactly its gain at its centre frequency", () => {
    for (const gain of [-12, -3, 3, 9]) {
      expect(dbAt({ type: "Peak", fc: 1000, gainDb: gain, q: 2 }, 1000)).toBeCloseTo(gain, 6);
    }
  });

  it("returns to unity well away from the centre", () => {
    const band: EqBand = { type: "Peak", fc: 1000, gainDb: 12, q: 4 };
    expect(dbAt(band, 40)).toBeCloseTo(0, 1);
    expect(dbAt(band, 18000)).toBeCloseTo(0, 1);
  });

  it("is flat everywhere at zero gain", () => {
    const band: EqBand = { type: "Peak", fc: 1000, gainDb: 0, q: 1 };
    for (const f of [20, 200, 1000, 5000, 20000]) {
      expect(dbAt(band, f)).toBeCloseTo(0, 9);
    }
  });

  it("is symmetric: a cut is the mirror of the matching boost", () => {
    const boost = dbAt({ type: "Peak", fc: 1000, gainDb: 6, q: 1.4 }, 700);
    const cut = dbAt({ type: "Peak", fc: 1000, gainDb: -6, q: 1.4 }, 700);
    expect(boost).toBeCloseTo(-cut, 6);
  });
});

describe("shelving filters", () => {
  it("reaches its gain below the corner and unity above it", () => {
    const band: EqBand = { type: "LowShelf", fc: 200, gainDb: 6, q: 0.707 };
    expect(dbAt(band, 20)).toBeCloseTo(6, 1);
    expect(dbAt(band, 8000)).toBeCloseTo(0, 1);
  });

  it("is half way to its gain at the corner", () => {
    const band: EqBand = { type: "LowShelf", fc: 200, gainDb: 6, q: 0.707 };
    expect(dbAt(band, 200)).toBeCloseTo(3, 1);
  });

  it("mirrors for the high shelf", () => {
    const band: EqBand = { type: "HighShelf", fc: 4000, gainDb: -6, q: 0.707 };
    expect(dbAt(band, 20000)).toBeCloseTo(-6, 0);
    expect(dbAt(band, 100)).toBeCloseTo(0, 1);
  });
});

describe("notch, low pass and high pass", () => {
  it("kills the notch frequency and leaves the rest alone", () => {
    const band: EqBand = { type: "Notch", fc: 1000, gainDb: 0, q: 30 };
    expect(dbAt(band, 1000)).toBeLessThan(-60);
    expect(dbAt(band, 200)).toBeCloseTo(0, 1);
    expect(dbAt(band, 8000)).toBeCloseTo(0, 1);
  });

  it("puts the low pass corner at -3 dB and rolls off above it", () => {
    const band: EqBand = { type: "LowPass", fc: 2000, gainDb: 0, q: 0.707 };
    expect(dbAt(band, 2000)).toBeCloseTo(-3, 0);
    expect(dbAt(band, 200)).toBeCloseTo(0, 1);
    expect(dbAt(band, 16000)).toBeLessThan(-25);
  });

  it("puts the high pass corner at -3 dB and rolls off below it", () => {
    const band: EqBand = { type: "HighPass", fc: 200, gainDb: 0, q: 0.707 };
    expect(dbAt(band, 200)).toBeCloseTo(-3, 0);
    expect(dbAt(band, 4000)).toBeCloseTo(0, 1);
    expect(dbAt(band, 20)).toBeLessThan(-35);
  });
});

describe("responseDb", () => {
  it("is silent about an empty chain", () => {
    expect(responseDb([], logFrequencies(8))).toEqual(new Array(8).fill(0));
  });

  it("adds cascaded bands in dB, because they multiply in magnitude", () => {
    const a: EqBand = { type: "Peak", fc: 1000, gainDb: 4, q: 1 };
    const b: EqBand = { type: "Peak", fc: 1000, gainDb: 3, q: 1 };
    const freqs = [1000];
    expect(responseDb([a, b], freqs)[0]).toBeCloseTo(
      responseDb([a], freqs)[0] + responseDb([b], freqs)[0],
      9,
    );
  });
});

describe("suggestPreampDb", () => {
  it("is zero for a chain that never boosts", () => {
    expect(suggestPreampDb([])).toBe(0);
    expect(suggestPreampDb([{ type: "Peak", fc: 1000, gainDb: -6, q: 1 }])).toBe(0);
  });

  it("negates the chain's own peak, rounded so it never under-compensates", () => {
    expect(suggestPreampDb([{ type: "Peak", fc: 1000, gainDb: 6, q: 1 }])).toBe(-6);
    const suggestion = suggestPreampDb([{ type: "Peak", fc: 1000, gainDb: 4.25, q: 1 }]);
    expect(suggestion).toBeLessThanOrEqual(-4.25);
    expect(suggestion).toBeGreaterThan(-4.4);
  });

  it("catches a narrow boost that a fixed log grid would step over", () => {
    // Q 50 at 3210 Hz peaks in a band a few hertz wide, between two grid points.
    const suggestion = suggestPreampDb([{ type: "Peak", fc: 3210, gainDb: 12, q: 50 }]);
    expect(suggestion).toBeLessThanOrEqual(-12);
  });

  it("accounts for bands that stack on the same frequency", () => {
    const suggestion = suggestPreampDb([
      { type: "Peak", fc: 1000, gainDb: 5, q: 1 },
      { type: "Peak", fc: 1000, gainDb: 5, q: 1 },
    ]);
    expect(suggestion).toBeLessThanOrEqual(-10);
  });
});
