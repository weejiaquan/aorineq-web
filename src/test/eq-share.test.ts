import { describe, expect, it } from "vitest";

import { MAX_BANDS, type EqBand, type EqPreset } from "@/lib/eq";
import { MAX_PAYLOAD_CHARS, decodePreset, encodePreset } from "@/lib/eq-share";

/**
 * The documented example in the app's README is the fixed point these tests hang on: if this
 * encoder ever stops producing that exact payload, links generated here stop being links the
 * app can read.
 */
const README_PLAIN = "v1|-6.1|LSC,105,-1.4,0.7;PK,3200,2.6,1.8";
const README_PAYLOAD = "djF8LTYuMXxMU0MsMTA1LC0xLjQsMC43O1BLLDMyMDAsMi42LDEuOA";

const README_PRESET: EqPreset = {
  name: "Shared preset",
  preampDb: -6.1,
  bands: [
    { type: "LowShelf", fc: 105, gainDb: -1.4, q: 0.7 },
    { type: "Peak", fc: 3200, gainDb: 2.6, q: 1.8 },
  ],
};

describe("encodePreset", () => {
  it("reproduces the payload documented in the app's README, byte for byte", () => {
    expect(encodePreset(README_PRESET)).toBe(README_PAYLOAD);
  });

  it("encodes the documented plain text behind that payload", () => {
    expect(Buffer.from(README_PAYLOAD, "base64url").toString("utf8")).toBe(README_PLAIN);
  });

  it("uses the base64url alphabet with no padding", () => {
    const payload = encodePreset({
      name: "x",
      preampDb: -0.5,
      bands: [{ type: "Notch", fc: 60, gainDb: 0, q: 30 }],
    });
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("leaves the preset name out of the payload — it rides as the link's name parameter", () => {
    const a = encodePreset({ ...README_PRESET, name: "one" });
    const b = encodePreset({ ...README_PRESET, name: "completely different" });
    expect(a).toBe(b);
  });

  it("writes shortest round-trippable numbers, not fixed decimals", () => {
    const payload = encodePreset({
      name: "x",
      preampDb: 0,
      bands: [{ type: "Peak", fc: 1000, gainDb: 3, q: 1.41 }],
    });
    expect(Buffer.from(payload, "base64url").toString("utf8")).toBe("v1|0|PK,1000,3,1.41");
  });
});

describe("decodePreset", () => {
  it("round-trips the README preset", () => {
    const result = decodePreset(README_PAYLOAD, "HD 650");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preset.name).toBe("HD 650");
    expect(result.preset.preampDb).toBe(-6.1);
    expect(result.preset.bands).toEqual(README_PRESET.bands);
  });

  it("round-trips a chain through encode and back", () => {
    const bands: EqBand[] = [
      { type: "HighPass", fc: 22, gainDb: 0, q: 0.7 },
      { type: "LowShelf", fc: 105.5, gainDb: 4.25, q: 0.71 },
      { type: "Peak", fc: 3200, gainDb: -4.8, q: 2.4 },
      { type: "HighShelf", fc: 9000, gainDb: 1.5, q: 0.7 },
      { type: "LowPass", fc: 19000, gainDb: 0, q: 0.7 },
      { type: "Notch", fc: 50, gainDb: 0, q: 30 },
    ];
    const result = decodePreset(encodePreset({ name: "n", preampDb: -7.3, bands }), "n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preset.bands).toEqual(bands);
    expect(result.preset.preampDb).toBe(-7.3);
  });

  it("drops gain on the filter types Equalizer APO gives no gain token", () => {
    const result = decodePreset(
      Buffer.from("v1|0|NO,50,9,30;LPQ,19000,-6,0.7;HPQ,22,3,0.7").toString("base64url"),
      "n",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preset.bands.map((b) => b.gainDb)).toEqual([0, 0, 0]);
  });

  it("clamps out-of-range values rather than refusing them", () => {
    const result = decodePreset(
      Buffer.from("v1|-999|PK,90000,400,900").toString("base64url"),
      "n",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preset.preampDb).toBe(-60);
    expect(result.preset.bands[0]).toEqual({ type: "Peak", fc: 24000, gainDb: 30, q: 50 });
  });

  it("rejects an empty payload", () => {
    expect(decodePreset("", "n")).toEqual({ ok: false, error: "The shared preset is empty." });
  });

  it("rejects a payload past the length cap before doing any work", () => {
    const result = decodePreset("a".repeat(MAX_PAYLOAD_CHARS + 1), "n");
    expect(result).toEqual({ ok: false, error: "The shared preset is too large for a link." });
  });

  it("rejects characters outside the base64url alphabet", () => {
    const result = decodePreset("djF8LTYuMXxMU0M+", "n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/base64url/);
  });

  it("rejects a group with a single leftover character", () => {
    expect(decodePreset("abcde", "n").ok).toBe(false);
  });

  it("rejects bytes that are not valid UTF-8", () => {
    const result = decodePreset(Buffer.from([0xff, 0xfe, 0xfd]).toString("base64url"), "n");
    expect(result).toEqual({ ok: false, error: "The shared preset isn't valid text." });
  });

  it("reports an unknown version as needing a newer app, not as corruption", () => {
    const result = decodePreset(Buffer.from("v2|0|PK,1000,3,1").toString("base64url"), "n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/unsupported version/);
  });

  it("rejects a non-numeric preamp", () => {
    const result = decodePreset(Buffer.from("v1|loud|PK,1000,3,1").toString("base64url"), "n");
    expect(result).toEqual({ ok: false, error: "The shared preset's preamp isn't a number." });
  });

  it("rejects a payload with no bands", () => {
    expect(decodePreset(Buffer.from("v1|0|").toString("base64url"), "n")).toEqual({
      ok: false,
      error: "The shared preset has no bands.",
    });
  });

  it("names the band that is wrong and why", () => {
    const result = decodePreset(
      Buffer.from("v1|0|PK,1000,3,1;XX,200,1,1").toString("base64url"),
      "n",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe(
      "Band 2 of the shared preset is invalid: 'XX' isn't a supported filter type.",
    );
  });

  it("rejects a band with the wrong field count", () => {
    const result = decodePreset(Buffer.from("v1|0|PK,1000,3").toString("base64url"), "n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/expected 4 comma-separated fields, found 3/);
  });

  it("rejects a band whose numbers are not numbers", () => {
    const result = decodePreset(Buffer.from("v1|0|PK,loud,3,1").toString("base64url"), "n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/must each be a finite number/);
  });

  it("refuses more bands than a scope can hold", () => {
    const chain = Array.from({ length: MAX_BANDS + 1 }, () => "PK,1000,1,1").join(";");
    const result = decodePreset(Buffer.from(`v1|0|${chain}`).toString("base64url"), "n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/too many bands \(65; the limit is 64\)/);
  });

  it("accepts a chain exactly at the cap", () => {
    const chain = Array.from({ length: MAX_BANDS }, () => "PK,1000,1,1").join(";");
    const result = decodePreset(Buffer.from(`v1|0|${chain}`).toString("base64url"), "n");
    expect(result.ok).toBe(true);
  });

  it("surfaces a stray separator as a bad band rather than dropping the rest", () => {
    const result = decodePreset(
      Buffer.from("v1|0|PK,1000,3,1|PK,2000,3,1").toString("base64url"),
      "n",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Band 1 of the shared preset is invalid/);
  });
});
