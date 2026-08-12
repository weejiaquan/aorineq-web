/**
 * What one frame of a skin draws, ported from `SkinOsdWindow.ShowVolume`.
 *
 * The canvas component owns pixels; this owns the decisions — which layers are visible, what
 * each is clipped to, what opacity it carries, and what number goes on top. Keeping them apart
 * is what makes the compositing testable in Node: a preview that agrees with the OSD is the
 * only reason to show a preview at all, and "trust the canvas" is not a test.
 */

import type { SkinConfig } from "./skin";
import { complementClip, fillWidth, type Rect } from "./skin-math";

/** The three artwork layers a skin can ship. `muted` is optional; the other two are required. */
export type SkinLayerName = "empty" | "full" | "muted";

export interface FrameLayer {
  layer: SkinLayerName;
  /** Opacity to draw at, matching the app's `Image.Opacity`. */
  alpha: number;
  /** Rects (full canvas height) to clip to, or null to draw the whole canvas. */
  clip: Rect[] | null;
}

export interface SkinFrame {
  /** Layers in draw order, back to front. */
  layers: FrameLayer[];
  /** The percent number to draw over them, or null when the skin shows none. */
  label: string | null;
}

/**
 * The layers and label for one percent.
 *
 * Unmuted, this is the app's two-layer composite: the full layer clipped from the left edge to
 * the fill width, and the empty layer clipped to the COMPLEMENT of the lit span so it never
 * stacks underneath a translucent full layer and doubles the bar.
 *
 * Muted splits on whether the skin ships `muted.png`. With one, that layer is shown ALONE at
 * full opacity — the artwork is the mute indication, which is why the app also drops its mute
 * badge in this case. Without one, the app's fallback: the empty layer alone, dimmed by the
 * skin's own `mutedDim`.
 *
 * The number keeps reading the real percent while muted, as it does in the OSD — Windows keeps
 * the volume level across a mute, and the skin's job is to show it.
 */
export function planSkinFrame(
  config: SkinConfig,
  percent: number,
  muted: boolean,
  hasMutedLayer: boolean,
  canvasWidth: number,
): SkinFrame {
  const label = config.text?.show ? String(percent) : null;

  if (muted) {
    return {
      layers: hasMutedLayer
        ? [{ layer: "muted", alpha: 1, clip: null }]
        : [{ layer: "empty", alpha: config.mutedDim, clip: null }],
      label,
    };
  }

  const lit = fillWidth(percent, config.fillStartX, config.fillEndX);
  return {
    layers: [
      { layer: "empty", alpha: 1, clip: complementClip(config.fillStartX, lit, canvasWidth) },
      { layer: "full", alpha: 1, clip: [{ x: 0, width: lit }] },
    ],
    label,
  };
}
