import { describe, expect, it } from "vitest";

import {
  DEFAULT_NOTCH_Q,
  DEFAULT_Q,
  clampBand,
  clampPreamp,
  formatFilterLine,
  hasGain,
  parsePreset,
  parseTypeToken,
  serializePreset,
  typeToken,
  type EqBand,
} from "@/lib/eq";

describe("filter type tokens", () => {
  it("uses Equalizer APO's canonical Q-carrying tokens", () => {
    expect(typeToken("Peak")).toBe("PK");
    expect(typeToken("LowShelf")).toBe("LSC");
    expect(typeToken("HighShelf")).toBe("HSC");
    expect(typeToken("Notch")).toBe("NO");
    expect(typeToken("LowPass")).toBe("LPQ");
    expect(typeToken("HighPass")).toBe("HPQ");
  });

  it("accepts the Q-less aliases other tools write", () => {
    expect(parseTypeToken("PEQ")).toBe("Peak");
    expect(parseTypeToken("ls")).toBe("LowShelf");
    expect(parseTypeToken("HS")).toBe("HighShelf");
    expect(parseTypeToken("lp")).toBe("LowPass");
    expect(parseTypeToken("HP")).toBe("HighPass");
  });

  it("returns null for a token it does not know", () => {
    expect(parseTypeToken("BANDPASS")).toBeNull();
  });

  it("knows which types carry a gain", () => {
    expect(hasGain("Peak")).toBe(true);
    expect(hasGain("LowShelf")).toBe(true);
    expect(hasGain("HighShelf")).toBe(true);
    expect(hasGain("Notch")).toBe(false);
    expect(hasGain("LowPass")).toBe(false);
    expect(hasGain("HighPass")).toBe(false);
  });
});

describe("clampBand", () => {
  it("pulls every parameter into the supported range", () => {
    expect(clampBand({ type: "Peak", fc: 1, gainDb: -99, q: 0.001 })).toEqual({
      type: "Peak",
      fc: 10,
      gainDb: -30,
      q: 0.1,
    });
    expect(clampBand({ type: "Peak", fc: 90000, gainDb: 99, q: 900 })).toEqual({
      type: "Peak",
      fc: 24000,
      gainDb: 30,
      q: 50,
    });
  });

  it("replaces non-finite values with sane defaults instead of propagating NaN", () => {
    // A non-finite value is replaced by the model's default BEFORE clamping, so an infinite
    // gain reads as 0 dB rather than as the loudest legal boost.
    expect(clampBand({ type: "Peak", fc: NaN, gainDb: Infinity, q: NaN })).toEqual({
      type: "Peak",
      fc: 1000,
      gainDb: 0,
      q: DEFAULT_Q,
    });
  });

  it("clamps the preamp to the app's own limits", () => {
    expect(clampPreamp(-999)).toBe(-60);
    expect(clampPreamp(999)).toBe(20);
    expect(clampPreamp(-6.1)).toBe(-6.1);
  });
});

describe("formatFilterLine", () => {
  it("writes gain for the types that have one", () => {
    expect(formatFilterLine(1, { type: "Peak", fc: 3200, gainDb: 2.6, q: 1.8 })).toBe(
      "Filter 1: ON PK Fc 3200 Hz Gain 2.6 dB Q 1.80",
    );
  });

  it("omits gain for the types Equalizer APO gives none", () => {
    expect(formatFilterLine(2, { type: "Notch", fc: 50, gainDb: 9, q: 30 })).toBe(
      "Filter 2: ON NO Fc 50 Hz Q 30.00",
    );
  });

  it("trims trailing zeros from a fractional centre frequency", () => {
    expect(formatFilterLine(3, { type: "Peak", fc: 105.5, gainDb: 0, q: 0.7 })).toBe(
      "Filter 3: ON PK Fc 105.5 Hz Gain 0.0 dB Q 0.70",
    );
  });
});

describe("parsePreset", () => {
  it("reads an AutoEq-shaped file", () => {
    const preset = parsePreset(
      "HD 650",
      `Preamp: -6.1 dB
Filter 1: ON LSC Fc 105 Hz Gain -1.4 dB Q 0.70
Filter 2: ON PK Fc 3200 Hz Gain 2.6 dB Q 1.80
Filter 3: ON HSC Fc 10000 Hz Gain -1.0 dB Q 0.70`,
    );
    expect(preset.preampDb).toBe(-6.1);
    expect(preset.bands).toEqual([
      { type: "LowShelf", fc: 105, gainDb: -1.4, q: 0.7 },
      { type: "Peak", fc: 3200, gainDb: 2.6, q: 1.8 },
      { type: "HighShelf", fc: 10000, gainDb: -1, q: 0.7 },
    ]);
  });

  it("skips comments, blank lines, CRLF endings and disabled filters", () => {
    const preset = parsePreset(
      "n",
      "# a comment\r\n\r\nFilter 1: OFF PK Fc 100 Hz Gain 3 dB Q 1\r\nFilter 2: None\r\nFilter 3: ON PK Fc 200 Hz Gain 1 dB Q 1\r\n",
    );
    expect(preset.bands).toEqual([{ type: "Peak", fc: 200, gainDb: 1, q: 1 }]);
  });

  it("gives a missing Q the type's conventional default", () => {
    const preset = parsePreset("n", "Filter 1: ON NO Fc 50 Hz\nFilter 2: ON LSC Fc 100 Hz Gain 3 dB");
    expect(preset.bands[0].q).toBe(DEFAULT_NOTCH_Q);
    expect(preset.bands[1].q).toBe(DEFAULT_Q);
  });

  it("converts a bandwidth in octaves to Q", () => {
    const preset = parsePreset("n", "Filter 1: ON PK Fc 1000 Hz Gain 3 dB BW Oct 1.0");
    // RBJ: one octave at 1 kHz is very close to Q = 1.41.
    expect(preset.bands[0].q).toBeGreaterThan(1.38);
    expect(preset.bands[0].q).toBeLessThan(1.45);
  });

  it("ignores lines it cannot use instead of failing the file", () => {
    const preset = parsePreset(
      "n",
      "Device: Speakers\nChannel: all\nFilter 1: ON PK Fc 1000 Hz Gain 3 dB Q 1\nGraphicEQ: 20 -1",
    );
    expect(preset.bands).toHaveLength(1);
  });

  it("clamps a hostile file's absurd parameters", () => {
    const preset = parsePreset(
      "n",
      "Preamp: -9999 dB\nFilter 1: ON PK Fc 999999 Hz Gain 9999 dB Q 9999",
    );
    expect(preset.preampDb).toBe(-60);
    expect(preset.bands[0]).toEqual({ type: "Peak", fc: 24000, gainDb: 30, q: 50 });
  });

  it("round-trips through serialize", () => {
    const bands: EqBand[] = [
      { type: "LowShelf", fc: 105, gainDb: -1.4, q: 0.7 },
      { type: "Peak", fc: 3200, gainDb: 2.6, q: 1.8 },
      { type: "Notch", fc: 50, gainDb: 0, q: 30 },
    ];
    const text = serializePreset({ name: "n", preampDb: -6.1, bands });
    expect(parsePreset("n", text).bands).toEqual(bands);
    expect(parsePreset("n", text).preampDb).toBe(-6.1);
  });

  it("omits the preamp line when there is no preamp", () => {
    const text = serializePreset({
      name: "n",
      preampDb: 0,
      bands: [{ type: "Peak", fc: 1000, gainDb: 1, q: 1 }],
    });
    expect(text).toBe("Filter 1: ON PK Fc 1000 Hz Gain 1.0 dB Q 1.00\n");
  });
});
