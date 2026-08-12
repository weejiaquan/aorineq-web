/** A block of literal text — a config file, a link, a filter chain — that never wraps silently. */
export function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <figure className="panel my-5 overflow-hidden">
      {label ? (
        <figcaption className="eyebrow border-b border-line px-4 py-2">{label}</figcaption>
      ) : null}
      <pre className="overflow-x-auto px-4 py-3">
        <code className="font-mono text-[0.8125rem] leading-relaxed text-text">{children}</code>
      </pre>
    </figure>
  );
}
