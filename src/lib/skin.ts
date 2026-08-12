/**
 * `skin.json` parsing and normalization, ported from `src/AorinEQ.Core/SkinLoader.cs`.
 *
 * The desktop app clamps every field on load, so a skin that renders one way here and another
 * way in the OSD would be a bug in this file. The clamps, the defaults and the align
 * normalization below are the same values the app uses.
 */

import { clamp } from "./skin-math";

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const DEFAULT_SCALE = 1;
const MIN_FPS = 1;
const MAX_FPS = 60;
const DEFAULT_FPS = 10;
const MIN_FONT_SIZE = 4;
const MAX_FONT_SIZE = 200;
const MAX_OUTLINE_WIDTH = 20;
const MAX_SHADOW = 50;
const DEFAULT_MUTED_DIM = 0.6;

export type TextAlign = "left" | "center" | "right";

/** Position, visibility and styling of the percent number drawn over the skin. */
export interface SkinText {
  show: boolean;
  x: number;
  y: number;
  color: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  outlineColor: string | null;
  outlineWidth: number;
  shadowColor: string | null;
  shadowBlur: number;
  shadowDepth: number;
  align: TextAlign;
}

/** A loaded skin: everything the canvas renderer needs, all values already clamped. */
export interface SkinConfig {
  text: SkinText | null;
  scale: number;
  fps: number;
  emptyFrames: number;
  fullFrames: number;
  mutedFrames: number;
  mutedDim: number;
  fillStartX: number;
  fillEndX: number;
}

/** Anything but `center`/`right` reads as `left` — the historical anchor semantics of x. */
export function normalizeAlign(value: unknown): TextAlign {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  return v === "center" || v === "right" ? v : "left";
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nullIfBlank(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function emptyToDefault(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

/**
 * Normalizes a parsed `skin.json` against the layer's pixel size.
 *
 * `imageWidth` is the logical frame width; the fill range clamps into it exactly as the app
 * does, and an inverted or empty range is an authoring error rather than something to guess
 * around, so it throws instead of silently rendering nothing.
 */
export function parseSkinConfig(raw: unknown, imageWidth: number): SkinConfig {
  const json = (raw ?? {}) as Record<string, unknown>;

  const pt = json.percentText as Record<string, unknown> | undefined;
  const text: SkinText | null = pt
    ? {
        show: pt.show === true,
        x: num(pt.x) ?? 0,
        y: num(pt.y) ?? 0,
        color: emptyToDefault(pt.color, "#FFFFFFFF"),
        fontFamily: emptyToDefault(pt.fontFamily, "Segoe UI"),
        fontSize: clamp(num(pt.fontSize) ?? 14, MIN_FONT_SIZE, MAX_FONT_SIZE),
        bold: pt.bold === true,
        outlineColor: nullIfBlank(pt.outlineColor),
        outlineWidth: clamp(num(pt.outlineWidth) ?? 0, 0, MAX_OUTLINE_WIDTH),
        shadowColor: nullIfBlank(pt.shadowColor),
        shadowBlur: clamp(num(pt.shadowBlur) ?? 4, 0, MAX_SHADOW),
        shadowDepth: clamp(num(pt.shadowDepth) ?? 2, 0, MAX_SHADOW),
        align: normalizeAlign(pt.align),
      }
    : null;

  const fillStartX = clamp(Math.trunc(num(json.fillStartX) ?? 0), 0, imageWidth);
  const fillEndX = clamp(Math.trunc(num(json.fillEndX) ?? imageWidth), 0, imageWidth);
  if (fillStartX >= fillEndX) {
    throw new Error(`fillStartX (${fillStartX}) must be less than fillEndX (${fillEndX})`);
  }

  return {
    text,
    scale: clamp(num(json.scale) ?? DEFAULT_SCALE, MIN_SCALE, MAX_SCALE),
    fps: clamp(num(json.fps) ?? DEFAULT_FPS, MIN_FPS, MAX_FPS),
    emptyFrames: Math.max(1, Math.trunc(num(json.emptyFrames) ?? 1)),
    fullFrames: Math.max(1, Math.trunc(num(json.fullFrames) ?? 1)),
    mutedFrames: Math.max(1, Math.trunc(num(json.mutedFrames) ?? 1)),
    mutedDim: clamp(num(json.mutedDim) ?? DEFAULT_MUTED_DIM, 0, 1),
    fillStartX,
    fillEndX,
  };
}

/**
 * Turns a skin colour (`#AARRGGBB` or `#RRGGBB`) into a CSS colour. Alpha leads in the app's
 * format, which is the opposite of CSS `#RRGGBBAA` — reading it as CSS would tint every
 * outline in the wrong hue. Malformed values fall back rather than failing the render, which
 * is what the app's UI layer does.
 */
export function argbToCss(value: string, fallback = "#FFFFFF"): string {
  const hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex.toLowerCase()}`;
  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    const a = parseInt(hex.slice(0, 2), 16) / 255;
    const r = parseInt(hex.slice(2, 4), 16);
    const g = parseInt(hex.slice(4, 6), 16);
    const b = parseInt(hex.slice(6, 8), 16);
    return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
  }
  return fallback;
}
