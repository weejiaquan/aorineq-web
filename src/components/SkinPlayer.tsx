"use client";

import { useCallback, useId, useRef, useState } from "react";

import { SkinCanvas } from "./SkinCanvas";
import { fillWidth, percentFromX } from "@/lib/skin-math";
import { formatDb, toDb } from "@/lib/volume";
import type { GallerySkin } from "@/lib/skins-manifest";

/**
 * A skin you can scrub, with the same three readings the app produces from one number: the
 * artwork, the preamp value written to Equalizer APO, and the clip edge in image pixels.
 *
 * Dragging on the artwork behaves like dragging the real OSD — a click jumps straight to that
 * position rather than nudging, and positions in the decorative margins clamp to 0 and 100.
 */

export interface SkinPlayerProps {
  skin: GallerySkin;
  /** `hero` shows the full readout rail; `card` shows a compact percentage only. */
  variant?: "hero" | "card";
  initialPercent?: number;
}

export function SkinPlayer({ skin, variant = "card", initialPercent = 42 }: SkinPlayerProps) {
  const [percent, setPercent] = useState(initialPercent);
  const [muted, setMuted] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const sliderId = useId();

  const setFromPointer = useCallback(
    (clientX: number) => {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      if (rect.width === 0) return;
      // The artwork is CSS-scaled, so map the pointer back into image pixels first.
      const imageX = ((clientX - rect.left) / rect.width) * skin.width;
      setPercent(percentFromX(imageX, skin.config.fillStartX, skin.config.fillEndX));
      setMuted(false);
    },
    [skin.width, skin.config.fillStartX, skin.config.fillEndX],
  );

  const lit = fillWidth(percent, skin.config.fillStartX, skin.config.fillEndX);
  const isHero = variant === "hero";

  return (
    <div className="w-full">
      <div
        ref={frameRef}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) setFromPointer(event.clientX);
        }}
        className="cursor-ew-resize touch-none select-none"
      >
        <SkinCanvas
          emptyUrl={skin.emptyUrl}
          fullUrl={skin.fullUrl}
          width={skin.width}
          height={skin.height}
          config={skin.config}
          percent={percent}
          muted={muted}
        />
      </div>

      <div className={isHero ? "mt-5" : "mt-3"}>
        <label htmlFor={sliderId} className="sr-only">
          Volume for the {skin.title} preview
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          onChange={(event) => {
            setPercent(Number(event.target.value));
            setMuted(false);
          }}
          className="accent-amber h-2 w-full cursor-pointer"
        />
      </div>

      {isHero ? (
        <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-line bg-line">
          <Reading label="Volume" value={muted ? "muted" : `${percent}%`} />
          <Reading label="APO preamp" value={formatDb(toDb(percent, muted))} />
          <Reading label="Clip edge" value={`x = ${lit} px`} />
        </dl>
      ) : (
        <div className="readout mt-2 flex items-center justify-between text-muted">
          <span>
            <span className="text-amber">{muted ? "muted" : `${percent}%`}</span> · x = {lit} px
          </span>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="rounded-sm border border-line px-2 py-0.5 text-muted transition-colors hover:border-amber hover:text-amber"
            aria-pressed={muted}
          >
            {muted ? "unmute" : "mute"}
          </button>
        </div>
      )}

      {isHero ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="readout rounded-sm border border-line px-3 py-1.5 text-muted transition-colors hover:border-amber hover:text-amber"
            aria-pressed={muted}
          >
            {muted ? "Unmute" : `Mute (dims to ${Math.round(skin.config.mutedDim * 100)}%)`}
          </button>
          <p className="readout text-muted">
            Drag the artwork or the rail. Range {skin.config.fillStartX}–{skin.config.fillEndX} px
            of {skin.width} px.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel px-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="readout mt-1 text-base text-amber">{value}</dd>
    </div>
  );
}
