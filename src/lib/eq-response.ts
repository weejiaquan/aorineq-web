/**
 * Frequency-response math, ported from `src/AorinEQ.Core/EqResponse.cs`.
 *
 * RBJ audio-EQ-cookbook biquad coefficients per band type, evaluated on a log-spaced grid.
 * The curve this site draws for a shared preset is the same curve the app's confirm dialog
 * draws before you accept it.
 */

import { SAMPLE_RATE, type EqBand } from "./eq";

export const MIN_FREQUENCY = 20;
export const MAX_FREQUENCY = 20000;

export interface Biquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/** Log-spaced frequency grid, inclusive of both ends — the editor's x-axis sampling. */
export function logFrequencies(
  count: number,
  from = MIN_FREQUENCY,
  to = MAX_FREQUENCY,
): number[] {
  if (count < 2) throw new RangeError("count must be at least 2");
  const ratio = Math.log(to / from);
  const freqs = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    freqs[i] = from * Math.exp((ratio * i) / (count - 1));
  }
  return freqs;
}

/** RBJ cookbook coefficients for one band, normalized by a0. */
export function coefficients(band: EqBand): Biquad {
  const a = Math.pow(10, band.gainDb / 40);
  const w0 =
    (2 * Math.PI * Math.min(Math.max(band.fc, 1), SAMPLE_RATE / 2 - 1)) / SAMPLE_RATE;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const q = Math.max(band.q, 1e-4);
  const alpha = sin / (2 * q);

  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
  switch (band.type) {
    case "Peak":
      b0 = 1 + alpha * a;
      b1 = -2 * cos;
      b2 = 1 - alpha * a;
      a0 = 1 + alpha / a;
      a1 = -2 * cos;
      a2 = 1 - alpha / a;
      break;
    case "LowShelf": {
      const sqrtA = Math.sqrt(a);
      const twoSqrtAAlpha = 2 * sqrtA * alpha;
      b0 = a * (a + 1 - (a - 1) * cos + twoSqrtAAlpha);
      b1 = 2 * a * (a - 1 - (a + 1) * cos);
      b2 = a * (a + 1 - (a - 1) * cos - twoSqrtAAlpha);
      a0 = a + 1 + (a - 1) * cos + twoSqrtAAlpha;
      a1 = -2 * (a - 1 + (a + 1) * cos);
      a2 = a + 1 + (a - 1) * cos - twoSqrtAAlpha;
      break;
    }
    case "HighShelf": {
      const sqrtA = Math.sqrt(a);
      const twoSqrtAAlpha = 2 * sqrtA * alpha;
      b0 = a * (a + 1 + (a - 1) * cos + twoSqrtAAlpha);
      b1 = -2 * a * (a - 1 + (a + 1) * cos);
      b2 = a * (a + 1 + (a - 1) * cos - twoSqrtAAlpha);
      a0 = a + 1 - (a - 1) * cos + twoSqrtAAlpha;
      a1 = 2 * (a - 1 - (a + 1) * cos);
      a2 = a + 1 - (a - 1) * cos - twoSqrtAAlpha;
      break;
    }
    case "Notch":
      b0 = 1;
      b1 = -2 * cos;
      b2 = 1;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
    case "LowPass":
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
    case "HighPass":
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** |H(e^jw)| in dB at one frequency, from the standard closed form. */
export function magnitudeDb(c: Biquad, freq: number): number {
  const w = (2 * Math.PI * freq) / SAMPLE_RATE;
  const cos1 = Math.cos(w);
  const sin1 = Math.sin(w);
  const cos2 = Math.cos(2 * w);
  const sin2 = Math.sin(2 * w);
  const numRe = c.b0 + c.b1 * cos1 + c.b2 * cos2;
  const numIm = -(c.b1 * sin1 + c.b2 * sin2);
  const denRe = 1 + c.a1 * cos1 + c.a2 * cos2;
  const denIm = -(c.a1 * sin1 + c.a2 * sin2);
  const num = numRe * numRe + numIm * numIm;
  const den = denRe * denRe + denIm * denIm;
  return 10 * Math.log10(Math.max(num, 1e-30) / Math.max(den, 1e-30));
}

/** Summed response in dB — cascaded biquads multiply, so their dB responses add. */
export function responseDb(bands: readonly EqBand[], freqs: readonly number[]): number[] {
  const result = new Array<number>(freqs.length).fill(0);
  for (const band of bands) {
    const c = coefficients(band);
    for (let i = 0; i < freqs.length; i++) {
      result[i] += magnitudeDb(c, freqs[i]);
    }
  }
  return result;
}

/**
 * The clipping-prevention preamp the app suggests: the negation of the summed response's
 * maximum where positive, rounded so the suggestion never under-compensates. The search grid
 * includes every band's exact centre frequency, because a narrow high-Q boost peaks AT its Fc
 * and a fixed log grid can step straight over it.
 */
export function suggestPreampDb(bands: readonly EqBand[]): number {
  const freqs = logFrequencies(512).concat(
    bands.map((b) => Math.min(Math.max(b.fc, MIN_FREQUENCY), MAX_FREQUENCY)),
  );
  const response = responseDb(bands, freqs);
  const max = response.length === 0 ? 0 : Math.max(...response);
  return max <= 0 ? 0 : -Math.ceil(max * 10) / 10;
}
