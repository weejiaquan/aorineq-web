"use client";

import { useState } from "react";

import { MediaFigure } from "@/components/MediaFigure";
import type { LoadedCapture } from "@/lib/media";
import { formatBytes } from "@/lib/site";

/**
 * A capture that asks before it downloads itself.
 *
 * Lazy loading only defers the cost until the thing scrolls into view; it does not decide
 * whether the visitor wanted it. For a capture that weighs more than the rest of the page put
 * together, the honest control is a button that says what it costs. The closed state reserves
 * the capture's exact aspect ratio, so pressing play swaps the artwork in without moving a
 * pixel of the page.
 */
export function DeferredMedia({ capture }: { capture: LoadedCapture }) {
  const [playing, setPlaying] = useState(false);

  if (playing) return <MediaFigure capture={capture} />;

  return (
    <MediaFigure capture={capture}>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="group flex w-full flex-col items-center justify-center gap-2 bg-raised px-6 text-center transition-colors hover:bg-panel"
        style={{ aspectRatio: `${capture.width} / ${capture.height}` }}
      >
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-amber transition-colors group-hover:border-amber"
        >
          ▶
        </span>
        <span className="font-display text-lg font-semibold text-text">Play the capture</span>
        <span className="eyebrow">
          {capture.width} × {capture.height} · {formatBytes(capture.bytes)} GIF
        </span>
        <span className="max-w-md text-sm text-muted">{capture.alt}</span>
      </button>
    </MediaFigure>
  );
}
