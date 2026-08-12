import { fetchLatestRelease } from "@/lib/release";
import { RELEASES_URL, formatBytes } from "@/lib/site";
import { CopyButton } from "./CopyButton";

/**
 * The download control, built from the latest GitHub release.
 *
 * The digest is shown next to the button rather than hidden behind a link because AorinEQ's
 * own updater refuses an exe whose SHA-256 doesn't match this value — a reader can hold a
 * manual download to the same rule with one command.
 */
export async function DownloadCta({ compact = false }: { compact?: boolean }) {
  const release = await fetchLatestRelease();
  const href = release?.exe?.downloadUrl ?? RELEASES_URL;
  const version = release?.tag ?? "latest release";
  const size = release?.exe ? formatBytes(release.exe.size) : null;

  return (
    <div className={compact ? "" : "w-full"}>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={href}
          className="inline-flex items-center gap-3 rounded-sm bg-amber px-5 py-3 font-display text-base font-semibold tracking-tight text-ink transition-opacity hover:opacity-90"
        >
          Download AorinEQ.exe
          <span className="font-mono text-xs font-normal opacity-80">
            {version}
            {size ? ` · ${size}` : ""}
          </span>
        </a>
        <a
          href={RELEASES_URL}
          className="rounded-sm border border-line px-4 py-3 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
        >
          All releases
        </a>
      </div>

      <p className="mt-3 text-sm text-muted">
        Windows 10/11 · single self-contained file · no .NET install · MIT licensed
      </p>

      {release?.sha256 ? (
        <div className="mt-4 max-w-2xl rounded-sm border border-line bg-panel p-4">
          <div className="flex items-start justify-between gap-4">
            <p className="eyebrow">SHA-256 · AorinEQ.exe</p>
            <CopyButton value={release.sha256} label="Copy digest" />
          </div>
          <p className="readout mt-2 text-mint">{release.sha256}</p>
          <p className="readout mt-3 text-muted">
            Get-FileHash .\AorinEQ.exe -Algorithm SHA256
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          The release digest could not be read just now.{" "}
          <a href={RELEASES_URL} className="text-amber underline-offset-4 hover:underline">
            Take it from the release page
          </a>{" "}
          — every release ships AorinEQ.exe.sha256 next to the exe.
        </p>
      )}
    </div>
  );
}
