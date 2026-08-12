import { describe, expect, it } from "vitest";

import { argbToCss, normalizeAlign, parseSkinConfig } from "@/lib/skin";

const WIDTH = 1500;

describe("parseSkinConfig defaults", () => {
  it("gives an empty config the same defaults the loader does", () => {
    const config = parseSkinConfig({}, WIDTH);
    expect(config.text).toBeNull();
    expect(config.scale).toBe(1);
    expect(config.fps).toBe(10);
    expect(config.emptyFrames).toBe(1);
    expect(config.fullFrames).toBe(1);
    expect(config.mutedFrames).toBe(1);
    expect(config.mutedDim).toBe(0.6);
    expect(config.fillStartX).toBe(0);
    expect(config.fillEndX).toBe(WIDTH);
  });

  it("treats a missing file the same as an empty one", () => {
    expect(parseSkinConfig(null, WIDTH)).toEqual(parseSkinConfig({}, WIDTH));
  });
});

describe("parseSkinConfig clamping", () => {
  it("clamps scale to 0.25-4", () => {
    expect(parseSkinConfig({ scale: 0.01 }, WIDTH).scale).toBe(0.25);
    expect(parseSkinConfig({ scale: 99 }, WIDTH).scale).toBe(4);
    expect(parseSkinConfig({ scale: 0.35 }, WIDTH).scale).toBe(0.35);
  });

  it("clamps fps to 1-60", () => {
    expect(parseSkinConfig({ fps: 0 }, WIDTH).fps).toBe(1);
    expect(parseSkinConfig({ fps: 1000 }, WIDTH).fps).toBe(60);
  });

  it("forces frame counts to at least one", () => {
    const config = parseSkinConfig({ emptyFrames: 0, fullFrames: -3, mutedFrames: 0 }, WIDTH);
    expect(config.emptyFrames).toBe(1);
    expect(config.fullFrames).toBe(1);
    expect(config.mutedFrames).toBe(1);
  });

  it("clamps mutedDim to 0-1", () => {
    expect(parseSkinConfig({ mutedDim: -1 }, WIDTH).mutedDim).toBe(0);
    expect(parseSkinConfig({ mutedDim: 5 }, WIDTH).mutedDim).toBe(1);
    expect(parseSkinConfig({ mutedDim: 0.45 }, WIDTH).mutedDim).toBe(0.45);
  });

  it("clamps the fill range into the image", () => {
    const config = parseSkinConfig({ fillStartX: -50, fillEndX: 9000 }, WIDTH);
    expect(config.fillStartX).toBe(0);
    expect(config.fillEndX).toBe(WIDTH);
  });

  it("refuses an inverted or empty range instead of guessing", () => {
    expect(() => parseSkinConfig({ fillStartX: 900, fillEndX: 100 }, WIDTH)).toThrow(
      /fillStartX \(900\) must be less than fillEndX \(100\)/,
    );
    expect(() => parseSkinConfig({ fillStartX: 400, fillEndX: 400 }, WIDTH)).toThrow();
  });

  it("ignores non-numeric values rather than producing NaN", () => {
    const config = parseSkinConfig({ scale: "big", fps: null, fillStartX: {} }, WIDTH);
    expect(config.scale).toBe(1);
    expect(config.fps).toBe(10);
    expect(config.fillStartX).toBe(0);
  });
});

describe("parseSkinConfig percentText", () => {
  it("carries the styling through with the loader's defaults filled in", () => {
    const config = parseSkinConfig(
      { percentText: { show: true, x: 1283, y: 466, color: "#FFFEC707", fontSize: 75, bold: true } },
      WIDTH,
    );
    expect(config.text).toEqual({
      show: true,
      x: 1283,
      y: 466,
      color: "#FFFEC707",
      fontFamily: "Segoe UI",
      fontSize: 75,
      bold: true,
      outlineColor: null,
      outlineWidth: 0,
      shadowColor: null,
      shadowBlur: 4,
      shadowDepth: 2,
      align: "left",
    });
  });

  it("clamps font size, outline width and shadow", () => {
    const config = parseSkinConfig(
      {
        percentText: {
          show: true,
          fontSize: 5000,
          outlineWidth: 99,
          shadowBlur: 900,
          shadowDepth: -4,
        },
      },
      WIDTH,
    );
    expect(config.text?.fontSize).toBe(200);
    expect(config.text?.outlineWidth).toBe(20);
    expect(config.text?.shadowBlur).toBe(50);
    expect(config.text?.shadowDepth).toBe(0);
  });

  it("treats a blank colour string as absent so the effect stays off", () => {
    const config = parseSkinConfig(
      { percentText: { show: true, outlineColor: "   ", shadowColor: "", color: "" } },
      WIDTH,
    );
    expect(config.text?.outlineColor).toBeNull();
    expect(config.text?.shadowColor).toBeNull();
    expect(config.text?.color).toBe("#FFFFFFFF");
  });
});

describe("normalizeAlign", () => {
  it("accepts centre and right in any case", () => {
    expect(normalizeAlign("center")).toBe("center");
    expect(normalizeAlign("  RIGHT ")).toBe("right");
  });

  it("reads anything else as left", () => {
    expect(normalizeAlign("middle")).toBe("left");
    expect(normalizeAlign(undefined)).toBe("left");
    expect(normalizeAlign(7)).toBe("left");
  });
});

describe("argbToCss", () => {
  it("reads alpha from the FRONT, unlike CSS", () => {
    expect(argbToCss("#FFFEC707")).toBe("rgba(254, 199, 7, 1)");
    expect(argbToCss("#80000000")).toBe("rgba(0, 0, 0, 0.502)");
  });

  it("passes six-digit colours through", () => {
    expect(argbToCss("#FEC707")).toBe("#fec707");
  });

  it("falls back rather than throwing on user-authored nonsense", () => {
    expect(argbToCss("chartreuse")).toBe("#FFFFFF");
    expect(argbToCss("#12345")).toBe("#FFFFFF");
    expect(argbToCss("", "#000000")).toBe("#000000");
  });
});
