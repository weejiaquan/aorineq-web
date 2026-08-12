/**
 * The `data=` payload codec for `aorineq://apply-preset`, ported from
 * `src/AorinEQ.Core/EqShare.cs`.
 *
 * The plain text behind the base64url is a documented contract, so any site can generate
 * links:
 *
 *     v1|<preamp dB>|<TYPE>,<Fc Hz>,<gain dB>,<Q>;…
 *
 * Decoding treats the payload as hostile in the same order the app does: length cap, then
 * alphabet, then strict UTF-8, then band count, then per-field parsing, then clamping. A
 * payload either yields a whole preset or is refused with a reason.
 */

import {
  MAX_BANDS,
  clampBand,
  clampPreamp,
  parseTypeToken,
  typeToken,
  hasGain,
  type EqBand,
  type EqPreset,
} from "./eq";

export const VERSION = "v1";
export const DEFAULT_PRESET_NAME = "Shared preset";
/** Cap on the encoded payload, matching `EqShare.MaxPayloadChars`. */
export const MAX_PAYLOAD_CHARS = 3600;

/** Shortest round-trippable invariant form, matching .NET's default `double.ToString()`. */
function num(value: number): string {
  return String(value);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fromBase64Url(data: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(data)) return null;
  // No valid base64 group has a single leftover character.
  if (data.length % 4 === 1) return null;
  const standard = data.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(data.length / 4) * 4, "=");
  let binary: string;
  try {
    binary = atob(standard);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * The compact payload for a preset. The preset NAME is not part of the payload — it rides as
 * the link's `name` parameter, where the app validates it as a file name.
 */
export function encodePreset(preset: EqPreset): string {
  const bands = preset.bands
    .map((b) => `${typeToken(b.type)},${num(b.fc)},${num(b.gainDb)},${num(b.q)}`)
    .join(";");
  const plain = `${VERSION}|${num(preset.preampDb)}|${bands}`;
  return toBase64Url(new TextEncoder().encode(plain));
}

export type DecodeResult =
  | { ok: true; preset: EqPreset }
  | { ok: false; error: string };

function readNumber(token: string): number | null {
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(token)) return null;
  const v = Number(token);
  return Number.isFinite(v) ? v : null;
}

function readBand(field: string): { band: EqBand } | { reason: string } {
  const parts = field.split(",");
  if (parts.length !== 4) {
    return { reason: `expected 4 comma-separated fields, found ${parts.length}.` };
  }
  const type = parseTypeToken(parts[0]);
  if (type === null) return { reason: `'${parts[0]}' isn't a supported filter type.` };
  const fc = readNumber(parts[1]);
  const gain = readNumber(parts[2]);
  const q = readNumber(parts[3]);
  if (fc === null || gain === null || q === null) {
    return { reason: "frequency, gain and Q must each be a finite number." };
  }
  // Gainless types carry no gain in Equalizer APO's grammar; drop whatever the payload
  // claimed rather than letting it ride along invisibly.
  return { band: clampBand({ type, fc, gainDb: hasGain(type) ? gain : 0, q }) };
}

/** Decodes a payload into a preset under `name`, or fails with a reason. Never throws. */
export function decodePreset(data: string, name: string): DecodeResult {
  if (data.length === 0) return { ok: false, error: "The shared preset is empty." };
  if (data.length > MAX_PAYLOAD_CHARS) {
    return { ok: false, error: "The shared preset is too large for a link." };
  }
  const bytes = fromBase64Url(data);
  if (bytes === null) {
    return { ok: false, error: "The shared preset isn't valid base64url data." };
  }
  let plain: string;
  try {
    plain = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, error: "The shared preset isn't valid text." };
  }

  // Split with a limit so a stray '|' inside the band list surfaces as a bad band field
  // rather than silently dropping everything after it.
  const firstBar = plain.indexOf("|");
  const secondBar = firstBar < 0 ? -1 : plain.indexOf("|", firstBar + 1);
  const version = firstBar < 0 ? plain : plain.slice(0, firstBar);
  if (version !== VERSION) {
    return {
      ok: false,
      error:
        "This share link uses a preset format this version doesn't understand (unsupported version).",
    };
  }
  const preampToken = secondBar < 0 ? plain.slice(firstBar + 1) : plain.slice(firstBar + 1, secondBar);
  const preamp = firstBar < 0 ? null : readNumber(preampToken);
  if (preamp === null) {
    return { ok: false, error: "The shared preset's preamp isn't a number." };
  }
  const bandList = secondBar < 0 ? "" : plain.slice(secondBar + 1);
  if (bandList.length === 0) {
    return { ok: false, error: "The shared preset has no bands." };
  }

  const fields = bandList.split(";");
  if (fields.length > MAX_BANDS) {
    return {
      ok: false,
      error: `The shared preset has too many bands (${fields.length}; the limit is ${MAX_BANDS}).`,
    };
  }
  const bands: EqBand[] = [];
  for (let i = 0; i < fields.length; i++) {
    const result = readBand(fields[i]);
    if ("reason" in result) {
      return { ok: false, error: `Band ${i + 1} of the shared preset is invalid: ${result.reason}` };
    }
    bands.push(result.band);
  }

  return { ok: true, preset: { name, preampDb: clampPreamp(preamp), bands } };
}
