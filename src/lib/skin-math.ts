/**
 * Pixel-fill and text-anchor math for skin rendering.
 *
 * This is a line-for-line port of `src/AorinEQ.Core/SkinMath.cs` in the desktop app. The
 * gallery previews on this site are only worth showing if they agree with the real OSD to
 * the pixel, so the rounding mode is ported too: .NET rounds halves AWAY FROM ZERO, while
 * JavaScript's Math.round rounds halves toward +infinity. They differ at exactly -0.5, which
 * `percentFromX` can produce for a drag that lands just left of `fillStartX`.
 */

/** .NET's `Math.Round(value, MidpointRounding.AwayFromZero)`. */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Width in image pixels of the "full" overlay drawn over "empty" for a given percent.
 *
 * 0% clips at `fillStartX`, 100% at `fillEndX` — so a bar that occupies only part of a wider
 * decorative image still maps percent onto its own pixel edges. `full.png` is expected to
 * paint only the bar's lit pixels inside that range; static decoration belongs in `empty.png`.
 */
export function fillWidth(
  percent: number,
  fillStartX: number,
  fillEndX: number,
): number {
  const clamped = clamp(percent, 0, 100);
  return roundHalfAwayFromZero(fillStartX + (fillEndX - fillStartX) * (clamped / 100));
}

/**
 * Inverse of {@link fillWidth}: maps [fillStartX..fillEndX] back to 0..100 for click-to-set.
 * Positions in the decorative margins clamp to the nearest end; a degenerate range reads as 0.
 */
export function percentFromX(x: number, fillStartX: number, fillEndX: number): number {
  const range = fillEndX - fillStartX;
  const raw = range > 0 ? ((x - fillStartX) / range) * 100 : 0;
  return clamp(roundHalfAwayFromZero(raw), 0, 100);
}

export interface Rect {
  x: number;
  width: number;
}

/**
 * The regions of the empty layer that stay visible, ported from `SkinComposite.ComplementClip`
 * in the app's UI layer: everything EXCEPT the lit span [barStart..fillWidth].
 *
 * Without this the empty layer stacks underneath a translucent full layer inside the lit span
 * and the bar reads as doubled — a bug this project already shipped once. Decoration outside
 * the fill range still shows, which is the whole point of having a fill range.
 */
export function complementClip(
  barStart: number,
  fillWidth: number,
  canvasWidth: number,
): Rect[] {
  const leftEnd = clamp(barStart, 0, canvasWidth);
  const rightStart = clamp(fillWidth, 0, canvasWidth);
  const rects: Rect[] = [];
  if (leftEnd > 0) rects.push({ x: 0, width: leftEnd });
  if (rightStart < canvasWidth) rects.push({ x: rightStart, width: canvasWidth - rightStart });
  return rects;
}

/**
 * Left edge of the percent text when `x` is its ANCHOR under the given alignment:
 * left -> x, center -> x - width/2, right -> x - width.
 */
export function alignedTextX(x: number, textWidth: number, align: string): number {
  if (align === "center") return x - textWidth / 2;
  if (align === "right") return x - textWidth;
  return x;
}
