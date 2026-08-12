/**
 * A block of literal text — a config file, a filter chain, a URL.
 *
 * Line-based content scrolls sideways inside the block rather than wrapping, because a
 * wrapped config line reads as two lines. `wrap` is for single long tokens like a link, where
 * scrolling hides most of the value and wrapping shows all of it.
 */
export function CodeBlock({
  children,
  label,
  wrap = false,
}: {
  children: string;
  label?: string;
  wrap?: boolean;
}) {
  return (
    <figure className="panel my-5 overflow-hidden">
      {label ? (
        <figcaption className="eyebrow border-b border-line px-4 py-2">{label}</figcaption>
      ) : null}
      <pre className={`px-4 py-3 ${wrap ? "whitespace-pre-wrap break-all" : "overflow-x-auto"}`}>
        <code className="font-mono text-[0.8125rem] leading-relaxed text-text">{children}</code>
      </pre>
    </figure>
  );
}
