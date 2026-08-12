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
        className="flex w-full flex-col items-start justify-end bg-raised p-5 text-left transition-colors hover:bg-panel sm:p-7"
        style={{ aspectRatio: `${capture.width} / ${capture.height}` }}
      >
        <p className="eyebrow">
          {capture.width} × {capture.height} · {formatBytes(capture.bytes)} GIF
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-text">Play the capture</p>
        <p className="mt-1 max-w-md text-sm text-muted">{capture.alt}</p>
      </button>
    </MediaFigure>
  );
}
