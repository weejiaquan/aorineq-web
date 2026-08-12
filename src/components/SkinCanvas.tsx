"use client";

import { useEffect, useRef, useState } from "react";

import { alignedTextX, complementClip, fillWidth } from "@/lib/skin-math";
import { argbToCss, type SkinConfig } from "@/lib/skin";

/**
 * Draws a skin exactly the way AorinEQ's OSD draws it.
 *
 * The compositing order is the app's: the full layer is clipped to a rectangle from x=0 to the
 * fill width, and the empty layer is clipped to the COMPLEMENT of the lit span so it never
 * stacks underneath a translucent full layer. Drawing happens at the artwork's own pixel
 * resolution and the canvas is scaled with CSS, which is what the app does too — the percent
 * text's size and position are in image pixels, so any other approach would drift.
 */

export interface SkinCanvasProps {
  emptyUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  config: SkinConfig;
  percent: number;
  muted?: boolean;
  className?: string;
}

export function SkinCanvas({
  emptyUrl,
  fullUrl,
  width,
  height,
  config,
  percent,
  muted = false,
  className,
}: SkinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /**
   * The loaded pair carries the URLs it came from, so a render that happens between a prop
   * change and the new images arriving draws nothing rather than the previous skin.
   */
  const [layers, setLayers] = useState<{
    empty: HTMLImageElement;
    full: HTMLImageElement;
    emptyUrl: string;
    fullUrl: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Could not load ${src}`));
        image.src = src;
      });

    Promise.all([load(emptyUrl), load(fullUrl)])
      .then(([empty, full]) => {
        if (!cancelled) setLayers({ empty, full, emptyUrl, fullUrl });
      })
      .catch(() => {
        // A skin whose files are missing simply does not draw; there is nothing useful to
        // show in its place inside a canvas.
      });

    return () => {
      cancelled = true;
    };
  }, [emptyUrl, fullUrl]);

  const current =
    layers && layers.emptyUrl === emptyUrl && layers.fullUrl === fullUrl ? layers : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!current || !canvas) return;
    const { empty, full } = current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const lit = fillWidth(percent, config.fillStartX, config.fillEndX);

    // Empty layer: full canvas when muted (the mute dim reads over the whole plate), otherwise
    // only the regions the lit span does not cover.
    ctx.save();
    ctx.globalAlpha = muted ? config.mutedDim : 1;
    if (!muted) {
      ctx.beginPath();
      for (const rect of complementClip(config.fillStartX, lit, width)) {
        ctx.rect(rect.x, 0, rect.width, height);
      }
      ctx.clip();
    }
    ctx.drawImage(empty, 0, 0, width, height);
    ctx.restore();

    // Full layer: hidden while muted, otherwise clipped from the left edge to the fill width.
    if (!muted) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, lit, height);
      ctx.clip();
      ctx.drawImage(full, 0, 0, width, height);
      ctx.restore();
    }

    const text = config.text;
    if (text?.show) {
      ctx.save();
      // The app's unbold baseline is SemiBold, so a plain {show,x,y} skin keeps the weight it
      // has always had.
      ctx.font = `${text.bold ? 700 : 600} ${text.fontSize}px "${text.fontFamily}", "Segoe UI", sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      const label = muted ? "0" : String(percent);
      const measured = ctx.measureText(label).width;
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
        ctx.strokeText(label, x, text.y);
      }
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = argbToCss(text.color);
      ctx.fillText(label, x, text.y);
      ctx.restore();
    }
  }, [current, percent, muted, width, height, config]);

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
          ? "Skin preview, muted"
          : `Skin preview at ${percent} percent`
      }
    />
  );
}
