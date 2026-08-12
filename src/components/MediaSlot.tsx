/**
 * A reserved place for a real screenshot or capture of the app.
 *
 * These are deliberately empty and deliberately labelled. The site never fakes a screenshot:
 * until a real capture is dropped in, the slot says what belongs there and what it will show.
 */
export function MediaSlot({
  title,
  detail,
  aspect = "16 / 9",
}: {
  title: string;
  detail: string;
  aspect?: string;
}) {
  return (
    <div
      className="flex flex-col items-start justify-end rounded-sm border border-dashed border-line bg-panel p-5"
      style={{ aspectRatio: aspect }}
    >
      <p className="eyebrow">Screenshot pending</p>
      <p className="mt-1 font-display text-lg font-semibold text-text">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{detail}</p>
    </div>
  );
}
