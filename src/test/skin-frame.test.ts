import { describe, expect, it } from "vitest";

import { parseSkinConfig, type SkinConfig } from "@/lib/skin";
import { planSkinFrame } from "@/lib/skin-frame";
import { alignedTextX, fillWidth } from "@/lib/skin-math";

/**
 * The gallery preview is a claim: that this is what the OSD will put on your desktop. These
 * tests check the claim against the app's own compositing rules, using the two skins the site
 * actually serves — one with a muted layer and a centre-anchored number, one without.
 */

const MIKA_WIDTH = 1672;
const MIKA = parseSkinConfig(
  {
    percentText: {
      show: true,
      x: 1375,
      y: 421,
      color: "#FFF47F9E",
      fontFamily: "Calibri",
      fontSize: 80,
      align: "center",
    },
    scale: 0.3,
    fps: 10,
    fillStartX: 427,
    fillEndX: 1249,
  },
  MIKA_WIDTH,
);

/** A skin with no percent number and the default 0.6 mute dim, for the fallback path. */
const PLAIN = parseSkinConfig({ fillStartX: 100, fillEndX: 900 }, 1000);

function layer(config: SkinConfig, percent: number, name: "empty" | "full" | "muted", width: number) {
  const found = planSkinFrame(config, percent, false, false, width).layers.find(
    (l) => l.layer === name,
  );
  if (!found) throw new Error(`no ${name} layer at ${percent}%`);
  return found;
}

describe("planSkinFrame, unmuted", () => {
  it("clips the full layer to the app's fill edge at every percent", () => {
    for (let percent = 0; percent <= 100; percent++) {
      const clip = layer(MIKA, percent, "full", MIKA_WIDTH).clip;
      expect(clip).toEqual([{ x: 0, width: fillWidth(percent, 427, 1249) }]);
    }
  });

  it("puts the fill edge exactly on the bar's own pixels at the ends and the middle", () => {
    // 0% and 100% are the numbers a person can check against their own OSD by eye.
    expect(layer(MIKA, 0, "full", MIKA_WIDTH).clip).toEqual([{ x: 0, width: 427 }]);
    expect(layer(MIKA, 100, "full", MIKA_WIDTH).clip).toEqual([{ x: 0, width: 1249 }]);
    expect(layer(MIKA, 50, "full", MIKA_WIDTH).clip).toEqual([{ x: 0, width: 838 }]);
    expect(layer(MIKA, 25, "full", MIKA_WIDTH).clip).toEqual([{ x: 0, width: 633 }]);
  });

  it("shows the empty layer everywhere the lit span is not, so the bar never doubles", () => {
    // The illustration on both sides of the bar keeps showing; only [427..lit] is handed over.
    expect(layer(MIKA, 62, "empty", MIKA_WIDTH).clip).toEqual([
      { x: 0, width: 427 },
      { x: 937, width: MIKA_WIDTH - 937 },
    ]);
    expect(layer(MIKA, 62, "full", MIKA_WIDTH).clip).toEqual([{ x: 0, width: 937 }]);
  });

  it("draws empty under full, both fully opaque", () => {
    const frame = planSkinFrame(MIKA, 40, false, false, MIKA_WIDTH);
    expect(frame.layers.map((l) => l.layer)).toEqual(["empty", "full"]);
    expect(frame.layers.every((l) => l.alpha === 1)).toBe(true);
  });

  it("never draws the muted layer while unmuted, even when the skin ships one", () => {
    const frame = planSkinFrame(MIKA, 40, false, true, MIKA_WIDTH);
    expect(frame.layers.map((l) => l.layer)).toEqual(["empty", "full"]);
  });
});

describe("planSkinFrame, muted", () => {
  it("shows dedicated muted artwork alone and undimmed, as the OSD does", () => {
    const frame = planSkinFrame(MIKA, 62, true, true, MIKA_WIDTH);
    expect(frame.layers).toEqual([{ layer: "muted", alpha: 1, clip: null }]);
  });

  it("falls back to the dimmed empty layer for a skin with no muted artwork", () => {
    const frame = planSkinFrame(PLAIN, 62, true, false, 1000);
    expect(frame.layers).toEqual([{ layer: "empty", alpha: 0.6, clip: null }]);
  });

  it("hides the bar either way, so a muted skin never reads as playing", () => {
    for (const hasMuted of [true, false]) {
      const frame = planSkinFrame(MIKA, 100, true, hasMuted, MIKA_WIDTH);
      expect(frame.layers.some((l) => l.layer === "full")).toBe(false);
    }
  });

  it("keeps showing the real percent, because muting does not change the volume", () => {
    expect(planSkinFrame(MIKA, 62, true, true, MIKA_WIDTH).label).toBe("62");
    expect(planSkinFrame(MIKA, 0, true, true, MIKA_WIDTH).label).toBe("0");
  });
});

describe("planSkinFrame label", () => {
  it("reads the percent for a skin that shows one", () => {
    expect(planSkinFrame(MIKA, 5, false, false, MIKA_WIDTH).label).toBe("5");
    expect(planSkinFrame(MIKA, 100, false, false, MIKA_WIDTH).label).toBe("100");
  });

  it("is null for a skin with no percent text, and for one that hides it", () => {
    expect(planSkinFrame(PLAIN, 50, false, false, 1000).label).toBeNull();
    const hidden = parseSkinConfig({ percentText: { show: false, x: 10, y: 10 } }, 1000);
    expect(planSkinFrame(hidden, 50, false, false, 1000).label).toBeNull();
  });
});

describe("the percent number's anchor", () => {
  const text = MIKA.text!;

  it("is centre-anchored at the x the skin declares", () => {
    expect(text.align).toBe("center");
    expect(text.x).toBe(1375);
  });

  it("stays centred on that anchor as the digit count grows", () => {
    // Widths measured by the canvas grow with the digit count; whatever they are, the centre of
    // the drawn text must land on 1375. Left alignment would slide the number right instead.
    const widths = { "5": 44.5, "54": 89, "100": 133.5 };
    for (const [label, width] of Object.entries(widths)) {
      const left = alignedTextX(text.x, width, text.align);
      expect(left + width / 2, `"${label}" should stay centred`).toBeCloseTo(1375, 10);
      expect(left).toBeLessThan(text.x); // it really is offset, not merely equal by luck
    }
  });

  it("would have drifted by half the number's width if it were drawn left-aligned", () => {
    // The failure this guards against: a renderer that only implements left alignment puts
    // three digits 66 px right of where the OSD puts them.
    expect(alignedTextX(text.x, 133.5, "left") - alignedTextX(text.x, 133.5, "center")).toBeCloseTo(
      66.75,
      10,
    );
  });

  it("anchors the seed skin's number the same way, through the same code", () => {
    const seia = parseSkinConfig(
      { percentText: { show: true, x: 1283, y: 466, align: "center" }, fillStartX: 325, fillEndX: 1182 },
      1500,
    );
    expect(alignedTextX(seia.text!.x, 100, seia.text!.align) + 50).toBe(1283);
  });
});
