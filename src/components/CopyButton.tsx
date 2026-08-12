"use client";

import { useEffect, useRef, useState } from "react";

/** Copies a string to the clipboard and says so, in the same words as the button. */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        "shrink-0 rounded-sm border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
      }
    >
      <span aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : label}
      </span>
    </button>
  );
}
