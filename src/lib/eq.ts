/**
 * The parametric band model, ported from `src/AorinEQ.Core/Eq.cs`.
 *
 * Types, tokens, ranges and clamps are the app's, which is also Equalizer APO's vocabulary —
 * a preset written here pastes straight into EAPO, Peace or AutoEq.
 */

export type EqBandType = "Peak" | "LowShelf" | "HighShelf" | "Notch" | "LowPass" | "HighPass";

export interface EqBand {
  type: EqBandType;
  fc: number;
  gainDb: number;
  q: number;
}

export interface EqPreset {
  name: string;
  preampDb: number;
  bands: EqBand[];
}

export const MIN_FC = 10;
export const MAX_FC = 24000;
export const MAX_GAIN_DB = 30;
export const MIN_Q = 0.1;
export const MAX_Q = 50;
export const MIN_PREAMP_DB = -60;
export const MAX_PREAMP_DB = 20;
/** RBJ S=1 shelf / Butterworth — the Q for LS/HS/LP/HP lines that carry none. */
export const DEFAULT_Q = 0.707;
/** The conventional narrow notch, for NO lines that carry none. */
export const DEFAULT_NOTCH_Q = 30;
export const MAX_BANDS = 64;

const TYPE_TOKENS: Record<EqBandType, string> = {
  Peak: "PK",
  LowShelf: "LSC",
  HighShelf: "HSC",
  Notch: "NO",
  LowPass: "LPQ",
  HighPass: "HPQ",
};

const TOKEN_TYPES: Record<string, EqBandType> = {
  PK: "Peak", PEQ: "Peak",
  LS: "LowShelf", LSC: "LowShelf",
  HS: "HighShelf", HSC: "HighShelf",
  NO: "Notch",
  LP: "LowPass", LPQ: "LowPass",
  HP: "HighPass", HPQ: "HighPass",
};

/** The canonical Equalizer APO token for a band type — the Q-carrying forms. */
export function typeToken(type: EqBandType): string {
  return TYPE_TOKENS[type];
}

/** The band type a filter token names, or null. The Q-less aliases are accepted; case-insensitive. */
export function parseTypeToken(token: string): EqBandType | null {
  return TOKEN_TYPES[token.trim().toUpperCase()] ?? null;
}

/** Only Peak and the two shelves carry a gain; EAPO's grammar has no Gain token for the rest. */
export function hasGain(type: EqBandType): boolean {
  return type === "Peak" || type === "LowShelf" || type === "HighShelf";
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  const v = Number.isFinite(value) ? value : fallback;
  return Math.min(Math.max(v, min), max);
}

/** Pulls a band's parameters into the supported ranges — the shared boundary guard. */
export function clampBand(band: EqBand): EqBand {
  return {
    type: band.type,
    fc: clampNumber(band.fc, MIN_FC, MAX_FC, 1000),
    gainDb: clampNumber(band.gainDb, -MAX_GAIN_DB, MAX_GAIN_DB, 0),
    q: clampNumber(band.q, MIN_Q, MAX_Q, DEFAULT_Q),
  };
}

export function clampPreamp(preampDb: number): number {
  return clampNumber(preampDb, MIN_PREAMP_DB, MAX_PREAMP_DB, 0);
}

/** What the editor's "+" appends. */
export function newBand(): EqBand {
  return { type: "Peak", fc: 1000, gainDb: 0, q: 1.41 };
}

function fixed(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/** Fc with up to 2 decimals and trailing zeros trimmed, matching the app's `0.##`. */
function formatFc(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** One `Filter n: ON …` line in Equalizer APO's ParametricEQ format. */
export function formatFilterLine(number: number, band: EqBand): string {
  const gain = hasGain(band.type) ? ` Gain ${fixed(band.gainDb, 1)} dB` : "";
  return `Filter ${number}: ON ${typeToken(band.type)} Fc ${formatFc(band.fc)} Hz${gain} Q ${fixed(band.q, 2)}`;
}

/** The whole preset as ParametricEQ text — a Preamp line only when non-zero, then the filters. */
export function serializePreset(preset: EqPreset): string {
  const lines: string[] = [];
  if (preset.preampDb !== 0) lines.push(`Preamp: ${fixed(preset.preampDb, 1)} dB`);
  for (let i = 0; i < preset.bands.length; i++) {
    lines.push(formatFilterLine(i + 1, preset.bands[i]));
  }
  return lines.join("\n") + (lines.length > 0 ? "\n" : "");
}

function readNumber(token: string): number | null {
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(token.trim())) return null;
  const v = Number(token);
  return Number.isFinite(v) ? v : null;
}

/**
 * Parses ParametricEQ text tolerantly, the way the app does: comments, blank lines and
 * unrecognized lines are skipped, disabled filters are skipped, missing Q gets the type's
 * conventional default, `BW Oct` converts to Q, and every value is clamped. Never throws.
 */
export function parsePreset(name: string, text: string): EqPreset {
  let preampDb = 0;
  const bands: EqBand[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    if (line.toLowerCase().startsWith("preamp:")) {
      const rest = line.slice("preamp:".length).trim();
      const space = rest.indexOf(" ");
      const value = readNumber(space >= 0 ? rest.slice(0, space) : rest);
      if (value !== null) preampDb = clampPreamp(value);
      continue;
    }
    const band = parseFilterLine(line);
    if (band) bands.push(band);
  }
  return { name, preampDb, bands: bands.slice(0, MAX_BANDS) };
}

function parseFilterLine(line: string): EqBand | null {
  if (!line.toLowerCase().startsWith("filter")) return null;
  const colon = line.indexOf(":");
  if (colon < 0) return null;
  const tokens = line.slice(colon + 1).split(" ").filter((t) => t.length > 0);
  if (tokens.length < 2) return null;
  if (tokens[0].toUpperCase() !== "ON") return null;
  const type = parseTypeToken(tokens[1]);
  if (type === null) return null;

  let fc: number | null = null;
  let gain: number | null = null;
  let q: number | null = null;
  let bwOct: number | null = null;
  for (let i = 2; i < tokens.length - 1; i++) {
    switch (tokens[i].toUpperCase()) {
      case "FC":
        fc ??= readNumber(tokens[i + 1]);
        break;
      case "GAIN":
        gain ??= readNumber(tokens[i + 1]);
        break;
      case "Q":
        q ??= readNumber(tokens[i + 1]);
        break;
      case "BW":
        if (i + 2 < tokens.length && tokens[i + 1].toUpperCase() === "OCT") {
          bwOct ??= readNumber(tokens[i + 2]);
        }
        break;
    }
  }
  if (fc === null) return null;
  if (q === null && bwOct !== null && bwOct > 0) {
    // Full RBJ bandwidth-to-Q: 1/Q = 2·sinh(ln2/2 · BW · w0/sin w0).
    const w0 = (2 * Math.PI * Math.min(Math.max(fc, MIN_FC), MAX_FC)) / SAMPLE_RATE;
    q = 1 / (2 * Math.sinh(((Math.log(2) / 2) * bwOct * w0) / Math.sin(w0)));
  }
  const defaultQ = type === "Notch" ? DEFAULT_NOTCH_Q : DEFAULT_Q;
  return clampBand({ type, fc, gainDb: gain ?? 0, q: q ?? defaultQ });
}

/** Display/analysis rate, matching `EqResponse.SampleRate`. */
export const SAMPLE_RATE = 48000;
