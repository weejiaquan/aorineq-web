import Link from "next/link";

import { fetchLatestDigest, fetchLatestRelease } from "@/lib/release";
import {
  DOWNLOAD_URL,
  EXE_ASSET_NAME,
  LATEST_RELEASE_URL,
  SHA256_ASSET_NAME,
  SHA256_URL,
  formatBytes,
} from "@/lib/site";
import { CopyButton } from "./CopyButton";

/**
 * The download control.
 *
 * The button is a direct link to the exe: GitHub resolves `latest/download` itself and answers
 * with the file as an attachment, so one click downloads and there is no release page to read
 * and no asset list to pick from. Version, size and digest are read from GitHub separately and
 * only label the button — if any of that is unavailable the button still works.
 *
 * The SmartScreen note is not a disclaimer. AorinEQ is unsigned, so Windows will block the
 * first run with "Windows protected your PC", and a reader who does not know that abandons the
 * install there. Saying it before the download, with the digest as the answer to "should I
 * trust this", is the whole point of the block.
 */
export async function DownloadCta({ compact = false }: { compact?: boolean }) {
  const [release, sha256] = await Promise.all([fetchLatestRelease(), fetchLatestDigest()]);
  const size = release?.exeSize != null ? formatBytes(release.exeSize) : null;

  return (
    <div className={compact ? "" : "w-full"}>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={DOWNLOAD_URL}
          className="inline-flex flex-col rounded-sm bg-amber px-5 py-3 text-ink transition-opacity hover:opacity-90"
        >
          <span className="font-display text-base font-semibold tracking-tight">
            Download {EXE_ASSET_NAME}
          </span>
          <span className="font-mono text-xs">
            Windows 10/11 · {size ? `${size} · ` : ""}direct .exe download
          </span>
        </a>
        <a
          href={LATEST_RELEASE_URL}
          className="rounded-sm border border-line px-4 py-3 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
        >
          Release notes
        </a>
      </div>

      <p className="mt-3 text-sm text-muted">
        {release ? `Version ${release.tag}. ` : ""}Saves the file straight away — no installer, no
        .NET to add, MIT licensed. Run it wherever you want it to live.
      </p>

      {compact ? (
        <p className="mt-3 text-sm text-muted">
          Windows will show a blue{" "}
          <strong className="font-semibold text-rust">Windows protected your PC</strong> screen the
          first time: choose <strong className="font-semibold text-text">More info</strong> →{" "}
          <strong className="font-semibold text-text">Run anyway</strong>.{" "}
          <Link href="/docs/install#smartscreen" className="text-amber underline-offset-4 hover:underline">
            Why, and how to verify the file
          </Link>
          .
        </p>
      ) : (
        <aside
          aria-label="What Windows will show the first time you run it"
          className="mt-5 max-w-2xl rounded-sm border border-line bg-panel p-4"
        >
          <p className="font-display text-sm font-semibold text-rust">
            Windows will warn you the first time. That is expected.
          </p>
          <p className="mt-2 text-sm text-muted">
            AorinEQ is not code-signed — a certificate costs more than this free app does — so
            SmartScreen shows a blue{" "}
            <strong className="font-semibold text-text">Windows protected your PC</strong> screen
            and hides the Run button. Click{" "}
            <strong className="font-semibold text-text">More info</strong>, then{" "}
            <strong className="font-semibold text-text">Run anyway</strong>. It appears once.
          </p>

          {sha256 ? (
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/*
                  No version on this line. The digest is read from the sidecar for whatever
                  release is current, and the tag comes from a separately cached API call — so
                  naming a tag here could pin the wrong version onto a correct digest.
                */}
                <p className="eyebrow">Rather check first? SHA-256 · {EXE_ASSET_NAME}</p>
                <CopyButton value={sha256} label="Copy digest" />
              </div>
              <p className="readout mt-2 break-all text-mint">{sha256}</p>
              <p className="readout mt-3 text-muted">
                Get-FileHash .\{EXE_ASSET_NAME} -Algorithm SHA256
              </p>
              <p className="mt-3 text-sm text-muted">
                The same digest is published as{" "}
                <a href={SHA256_URL} className="text-amber underline-offset-4 hover:underline">
                  {SHA256_ASSET_NAME}
                </a>
                , and AorinEQ&apos;s own updater refuses any build that does not match it.
              </p>
            </div>
          ) : (
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              To check the file before running it, compare{" "}
              <span className="readout text-muted">
                Get-FileHash .\{EXE_ASSET_NAME} -Algorithm SHA256
              </span>{" "}
              against{" "}
              <a href={SHA256_URL} className="text-amber underline-offset-4 hover:underline">
                {SHA256_ASSET_NAME}
              </a>
              , published beside every release.
            </p>
          )}
        </aside>
      )}
    </div>
  );
}
