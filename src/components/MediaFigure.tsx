import Image from "next/image";
import type { ReactNode } from "react";

import type { LoadedCapture } from "@/lib/media";

/**
 * A real capture of the app, framed like the panels around it.
 *
 * The image carries its own pixel size, so the browser knows the box's shape before a byte of
 * GIF arrives and nothing below it moves as it decodes. It is never blown up past that size —
 * a 900 px capture stretched across a 1200 px column is just a blurrier capture — and it is
 * never wider than its column, so nothing here can produce a sideways scroll on a phone.
 *
 * `children` replaces the image for the one capture heavy enough to ask before loading; see
 * {@link DeferredMedia}, which reuses this frame so the two states are the same box.
 */
export function MediaFigure({
  capture,
  className = "",
  children,
}: {
  capture: LoadedCapture;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <figure
      className={`panel overflow-hidden ${className}`}
      style={{ maxWidth: `${capture.width}px` }}
    >
      {children ?? (
        <Image
          src={capture.src}
          alt={capture.alt}
          width={capture.width}
          height={capture.height}
          // GIFs go through Next's optimizer as a single frame; unoptimized serves the real
          // animation, which is the entire point of the capture.
          unoptimized
          className="block h-auto w-full bg-raised"
        />
      )}
      <figcaption className="border-t border-line px-4 py-3 text-sm text-muted">
        {capture.caption}
      </figcaption>
    </figure>
  );
}
