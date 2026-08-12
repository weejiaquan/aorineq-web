import { describe, expect, it } from "vitest";

import {
  alignedTextX,
  complementClip,
  fillWidth,
  percentFromX,
  roundHalfAwayFromZero,
} from "@/lib/skin-math";

/**
 * These are the numbers the desktop app produces. Where a case looks arbitrary it is taken
 * from the seed skin (1500 px wide, bar from x=325 to x=1182), because that is the skin whose
 * preview a reader can compare against their own OSD.
 */

const START = 325;
const END = 1182;

describe("roundHalfAwayFromZero", () => {
  it("rounds positive halves up, matching .NET's MidpointRounding.AwayFromZero", () => {
    expect(roundHalfAwayFromZero(0.5)).toBe(1);
    expect(roundHalfAwayFromZero(1.5)).toBe(2);
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
  });

  it("rounds negative halves away from zero, where Math.round would not", () => {
    expect(Math.round(-0.5)).toBe(-0); // the behaviour being corrected
    expect(roundHalfAwayFromZero(-0.5)).toBe(-1);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
  });

  it("leaves non-midpoints alone", () => {
    expect(roundHalfAwayFromZero(0.4)).toBe(0);
    expect(roundHalfAwayFromZero(-1.4)).toBe(-1);
    expect(roundHalfAwayFromZero(7)).toBe(7);
  });
});

describe("fillWidth", () => {
  it("maps 0 and 100 exactly onto the range edges", () => {
    expect(fillWidth(0, START, END)).toBe(START);
    expect(fillWidth(100, START, END)).toBe(END);
  });

  it("interpolates linearly between them", () => {
    expect(fillWidth(50, START, END)).toBe(Math.round(START + (END - START) / 2));
    expect(fillWidth(50, 0, 1000)).toBe(500);
    expect(fillWidth(25, 0, 1000)).toBe(250);
  });

  it("uses the whole image when the range is the whole image", () => {
    expect(fillWidth(0, 0, 1500)).toBe(0);
    expect(fillWidth(100, 0, 1500)).toBe(1500);
    expect(fillWidth(33, 0, 1500)).toBe(495);
  });

  it("clamps percent instead of extrapolating past the bar", () => {
    expect(fillWidth(-40, START, END)).toBe(START);
    expect(fillWidth(1000, START, END)).toBe(END);
  });

  it("rounds a midpoint away from zero", () => {
    // 0 + 10 * 0.05 = 0.5 exactly.
    expect(fillWidth(5, 0, 10)).toBe(1);
  });
});

describe("percentFromX", () => {
  it("inverts fillWidth at the edges", () => {
    expect(percentFromX(START, START, END)).toBe(0);
    expect(percentFromX(END, START, END)).toBe(100);
  });

  it("clamps clicks in the decorative margins to the nearest end", () => {
    expect(percentFromX(0, START, END)).toBe(0);
    expect(percentFromX(120, START, END)).toBe(0);
    expect(percentFromX(1499, START, END)).toBe(100);
  });

  it("reads a degenerate range as 0 rather than dividing by zero", () => {
    expect(percentFromX(400, 500, 500)).toBe(0);
    expect(percentFromX(400, 900, 100)).toBe(0);
  });

  it("round-trips every percent through fillWidth for the seed skin's range", () => {
    for (let percent = 0; percent <= 100; percent++) {
      expect(percentFromX(fillWidth(percent, START, END), START, END)).toBe(percent);
    }
  });
});

describe("complementClip", () => {
  it("keeps the decorative margin on the left and everything past the lit edge", () => {
    expect(complementClip(START, 700, 1500)).toEqual([
      { x: 0, width: 325 },
      { x: 700, width: 800 },
    ]);
  });

  it("drops the left rect when the bar starts at the image edge", () => {
    expect(complementClip(0, 600, 1000)).toEqual([{ x: 600, width: 400 }]);
  });

  it("drops the right rect when the bar is completely lit", () => {
    expect(complementClip(200, 1000, 1000)).toEqual([{ x: 0, width: 200 }]);
  });

  it("returns nothing to draw when a full-width bar is fully lit", () => {
    expect(complementClip(0, 1000, 1000)).toEqual([]);
  });

  it("clamps a fill width that overshoots the canvas", () => {
    expect(complementClip(100, 5000, 1000)).toEqual([{ x: 0, width: 100 }]);
  });
});

describe("alignedTextX", () => {
  it("treats x as the left edge, centre or right edge per alignment", () => {
    expect(alignedTextX(1283, 120, "left")).toBe(1283);
    expect(alignedTextX(1283, 120, "center")).toBe(1223);
    expect(alignedTextX(1283, 120, "right")).toBe(1163);
  });

  it("falls back to left for anything the loader would not have normalized", () => {
    expect(alignedTextX(100, 40, "middle")).toBe(100);
    expect(alignedTextX(100, 40, "")).toBe(100);
  });

  it("keeps a centred number anchored as its digit count changes", () => {
    const twoDigits = alignedTextX(1283, 100, "center") + 100 / 2;
    const threeDigits = alignedTextX(1283, 150, "center") + 150 / 2;
    expect(twoDigits).toBe(threeDigits);
  });
});
