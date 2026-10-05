"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Wipes its children in the first time they scroll into view.
 *
 * Nothing is hidden until the browser has reported that the element is off screen, so content
 * already in view at load never flashes, and without JavaScript the page is simply all there.
 * The motion itself is in globals.css, keyed on `data-reveal`.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Milliseconds to hold back, for staggering siblings. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setState("hidden");
          return;
        }
        setState((current) => (current === "hidden" ? "shown" : current));
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={state}
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
