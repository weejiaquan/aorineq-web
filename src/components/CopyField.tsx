import { CopyButton } from "./CopyButton";

/** A generated value shown in full, with the copy control next to it. */
export function CopyField({
  label,
  value,
  tone = "amber",
}: {
  label: string;
  value: string;
  tone?: "amber" | "mint" | "text";
}) {
  const toneClass =
    tone === "mint" ? "text-mint" : tone === "text" ? "text-text" : "text-amber";
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow">{label}</p>
        <CopyButton value={value} />
      </div>
      <p className={`readout mt-2 ${toneClass}`}>{value}</p>
    </div>
  );
}
