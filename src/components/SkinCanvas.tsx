"use client";

import { useEffect, useRef, useState } from "react";

import { alignedTextX } from "@/lib/skin-math";
import { planSkinFrame, type SkinLayerName } from "@/lib/skin-frame";
import { argbToCss, type SkinConfig } from "@/lib/skin";

/**
 * Draws a skin exactly the way AorinEQ's OSD draws it.
 *
 * Which layers appear, what they are clipped to and what number goes on top is decided by
 * `planSkinFrame`, which is the port of the app's own compositing and is tested against it.
 * This component only turns that plan into pixels. Drawing happens at the artwork's own pixel
 * resolution and the canvas is scaled with CSS, which is what the app does too — the percent
 * text's size and position are in image pixels, so any other approach would drift.
 *
 * The one thing the OSD draws that this does not is its mute badge, a fixed 20 px chip in
 * window coordinates. This canvas has no window: it renders at image resolution and is scaled
 * to whatever width the layout gives it, so a chip drawn here would be a different size than
 * the app's on every skin. The player states mute in text beside the artwork instead.
 */

export interface SkinCanvasProps {
  emptyUrl: string;
  fullUrl: string;
  /** The optional muted-state layer. When present it replaces the artwork while muted. */
  mutedUrl?: string | null;
  width: number;
  height: number;
  config: SkinConfig;
  percent: number;
  muted?: boolean;
  className?: string;
}

type LoadedLayers = Partial<Record<SkinLayerName, HTMLImageElement>>;

export function SkinCanvas({
  emptyUrl,
  fullUrl,
  mutedUrl = null,
  width,
  height,
  config,
  percent,
  muted = false,
  className,
}: SkinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /**
   * The loaded set carries the URLs it came from, so a render that happens between a prop
   * change and the new images arriving draws nothing rather than the previous skin.
   */
  const sourceKey = `${emptyUrl}|${fullUrl}|${mutedUrl ?? ""}`;
  const [loaded, setLoaded] = useState<{ key: string; layers: LoadedLayers } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = (name: SkinLayerName, src: string) =>
      new Promise<[SkinLayerName, HTMLImageElement]>((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve([name, image]);
        image.onerror = () => reject(new Error(`Could not load ${src}`));
        image.src = src;
      });

    const wanted: Array<[SkinLayerName, string]> = [
      ["empty", emptyUrl],
      ["full", fullUrl],
    ];
    if (mutedUrl) wanted.push(["muted", mutedUrl]);

    Promise.all(wanted.map(([name, src]) => load(name, src)))
      .then((pairs) => {
        if (!cancelled) {
          setLoaded({ key: sourceKey, layers: Object.fromEntries(pairs) as LoadedLayers });
        }
      })
      .catch(() => {
        // A skin whose files are missing simply does not draw; there is nothing useful to
        // show in its place inside a canvas.
      });

    return () => {
      cancelled = true;
    };
  }, [sourceKey, emptyUrl, fullUrl, mutedUrl]);

  const layers = loaded?.key === sourceKey ? loaded.layers : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!layers || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const frame = planSkinFrame(config, percent, muted, Boolean(mutedUrl), width);

    for (const entry of frame.layers) {
      const image = layers[entry.layer];
      if (!image) continue; // only planned for layers this skin ships, so never taken in practice
      ctx.save();
      ctx.globalAlpha = entry.alpha;
      if (entry.clip) {
        ctx.beginPath();
        for (const rect of entry.clip) ctx.rect(rect.x, 0, rect.width, height);
        ctx.clip();
      }
      ctx.drawImage(image, 0, 0, width, height);
      ctx.restore();
    }

    const text = config.text;
    if (frame.label !== null && text) {
      ctx.save();
      // The app's unbold baseline is SemiBold, so a plain {show,x,y} skin keeps the weight it
      // has always had.
      ctx.font = `${text.bold ? 700 : 600} ${text.fontSize}px "${text.fontFamily}", "Segoe UI", sans-serif`;
      ctx.textBaseline = "top";
      // x is the ANCHOR under the skin's alignment, not the left edge; the measured width
      // changes with the digit count, so the offset is recomputed on every draw.
      ctx.textAlign = "left";
      const measured = ctx.measureText(frame.label).width;
      const x = alignedTextX(text.x, measured, text.align);

      if (text.shadowColor) {
        ctx.shadowColor = argbToCss(text.shadowColor, "rgba(0,0,0,0.5)");
        ctx.shadowBlur = text.shadowBlur;
        // WPF's DropShadowEffect at its conventional 315 degrees: down and to the right.
        const offset = text.shadowDepth / Math.SQRT2;
        ctx.shadowOffsetX = offset;
        ctx.shadowOffsetY = offset;
      }
      if (text.outlineColor && text.outlineWidth > 0) {
        ctx.strokeStyle = argbToCss(text.outlineColor);
        ctx.lineWidth = text.outlineWidth;
        ctx.lineJoin = "round";
        ctx.strokeText(frame.label, x, text.y);
      }
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = argbToCss(text.color);
      ctx.fillText(frame.label, x, text.y);
      ctx.restore();
    }
  }, [layers, percent, muted, mutedUrl, width, height, config]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label={
        muted
          ? `Skin preview, muted at ${percent} percent`
          : `Skin preview at ${percent} percent`
      }
    />
  );
}
