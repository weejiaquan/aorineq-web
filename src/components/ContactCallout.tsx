import { CONTACT_EMAIL, CONTACT_IS_PLACEHOLDER } from "@/lib/site";

/**
 * The address every policy page points at. It is a placeholder until the site owner sets it,
 * and says so loudly — a takedown route nobody can reach is worse than admitting there isn't
 * one yet.
 */
export function ContactCallout() {
  return (
    <div
      className={`my-6 rounded-sm border p-4 ${
        CONTACT_IS_PLACEHOLDER ? "border-rust/40 bg-panel" : "border-line bg-panel"
      }`}
    >
      <p className="eyebrow">Designated contact</p>
      {CONTACT_IS_PLACEHOLDER ? (
        <>
          <p className="readout mt-2 text-rust">{CONTACT_EMAIL}</p>
          <p className="mt-2 text-sm text-muted">
            This address is a placeholder and does not receive mail. The site owner must replace
            it in <code className="font-mono">src/lib/site.ts</code> before these policies mean
            anything. Until then, use the{" "}
            <a
              href="https://github.com/weejiaquan/aorineq/issues"
              className="text-amber underline-offset-4 hover:underline"
            >
              project issue tracker
            </a>
            .
          </p>
        </>
      ) : (
        <p className="readout mt-2 text-mint">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      )}
    </div>
  );
}
