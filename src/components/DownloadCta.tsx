import Link from "next/link";

import { assetSize, fetchAssetDigest, fetchLatestRelease } from "@/lib/release";
import {
  INSTALLER,
  LATEST_RELEASE_URL,
  PORTABLE,
  type ReleaseAsset,
  formatBytes,
} from "@/lib/site";
import { CopyButton } from "./CopyButton";

/**
 * The download control.
 *
 * Two builds of the same app, and the choice is made for the reader: the installer is the
 * button, the portable exe is the smaller link beside it. Both are direct links — GitHub
 * resolves `latest/download` itself and answers with the file as an attachment, so one click
 * downloads and there is no release page to read and no asset list to pick from. Version,
 * sizes and digests are read from GitHub separately and only label the buttons; if any of that
 * is unavailable the buttons still work.
 *
 * The SmartScreen note is not a disclaimer. Neither build is signed, so Windows blocks the
 * first run with "Windows protected your PC", and a reader who does not know that abandons the
 * install there. Saying it before the download, with each file's own digest as the answer to
 * "should I trust this", is the whole point of the block.
 */
export async function DownloadCta({ compact = false }: { compact?: boolean }) {
  const [release, installerSha256, portableSha256] = await Promise.all([
    fetchLatestRelease(),
    fetchAssetDigest(INSTALLER),
    fetchAssetDigest(PORTABLE),
  ]);
  const installerSize = assetSize(release, INSTALLER);
  const portableSize = assetSize(release, PORTABLE);

  return (
    <div className={compact ? "" : "w-full"}>
      <div className="flex flex-wrap items-stretch gap-3">
        <a
          href={INSTALLER.url}
          aria-label={`Download ${INSTALLER.assetName} — Windows installer, direct download`}
          className="inline-flex flex-col justify-center rounded-sm bg-amber px-5 py-3 text-ink transition-opacity hover:opacity-90"
        >
          <span className="font-display text-base font-semibold tracking-tight">
            Download {INSTALLER.assetName}
          </span>
          <span className="font-mono text-xs">
            Windows 10/11 · {installerSize != null ? `${formatBytes(installerSize)} · ` : ""}
            installer, no admin needed
          </span>
        </a>
        <a
          href={PORTABLE.url}
          aria-label={`Download ${PORTABLE.assetName} — portable single file, direct download`}
          className="inline-flex flex-col justify-center rounded-sm border border-line px-4 py-3 text-text transition-colors hover:border-amber"
        >
          <span className="font-display text-sm font-semibold tracking-tight">
            {PORTABLE.assetName}
          </span>
          <span className="font-mono text-xs text-muted">
            {portableSize != null ? `${formatBytes(portableSize)} · ` : ""}portable — no installer,
            just run it
          </span>
        </a>
        <a
          href={LATEST_RELEASE_URL}
          className="inline-flex items-center rounded-sm border border-line px-4 py-3 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
        >
          Release notes
        </a>
      </div>

      <p className="mt-3 text-sm text-muted">
        {release ? `Version ${release.tag}. ` : ""}The installer puts AorinEQ in your own user
        folder — no administrator prompt — and leaves a Start Menu shortcut and an entry in Apps
        &amp; Features. Both builds keep themselves updated, need no .NET, and are MIT licensed.
      </p>

      {compact ? (
        <p className="mt-3 text-sm text-muted">
          Neither build is signed, so Windows shows a blue{" "}
          <strong className="font-semibold text-rust">Windows protected your PC</strong> screen
          the first time: choose <strong className="font-semibold text-text">More info</strong> →{" "}
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
            Neither build is code-signed — a certificate costs more than this free app does — so
            SmartScreen shows a blue{" "}
            <strong className="font-semibold text-text">Windows protected your PC</strong> screen
            and hides the Run button, for the installer exactly as for the portable exe. Click{" "}
            <strong className="font-semibold text-text">More info</strong>, then{" "}
            <strong className="font-semibold text-text">Run anyway</strong>. It appears once.
          </p>

          <div className="mt-4 space-y-4 border-t border-line pt-4">
            <p className="text-sm text-muted">
              Rather check first? Each file is published with its own digest, and AorinEQ&apos;s
              updater refuses any build that does not match.
            </p>
            <AssetDigest asset={INSTALLER} sha256={installerSha256} />
            <AssetDigest asset={PORTABLE} sha256={portableSha256} />
          </div>
        </aside>
      )}
    </div>
  );
}

/**
 * One file's checksum, under that file's own name.
 *
 * There is deliberately no version on this line. The digest comes from the sidecar for
 * whatever release is current and the tag comes from a separately cached API call, so naming a
 * tag here could pin the wrong version onto a correct digest. The filename is the only label
 * that cannot go stale — and it is the file's own name, never the other download's.
 */
function AssetDigest({ asset, sha256 }: { asset: ReleaseAsset; sha256: string | null }) {
  if (!sha256) {
    return (
      <p className="text-sm text-muted">
        For <span className="readout text-text">{asset.assetName}</span>, compare{" "}
        <span className="readout text-muted">
          Get-FileHash .\{asset.assetName} -Algorithm SHA256
        </span>{" "}
        against{" "}
        <a href={asset.sha256Url} className="text-amber underline-offset-4 hover:underline">
          {asset.sha256AssetName}
        </a>
        .
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="eyebrow">SHA-256 · {asset.assetName}</p>
        <CopyButton value={sha256} label={`Copy ${asset.assetName} digest`} />
      </div>
      <p className="readout mt-2 break-all text-mint">{sha256}</p>
      <p className="readout mt-2 text-muted">
        Get-FileHash .\{asset.assetName} -Algorithm SHA256 · published as{" "}
        <a href={asset.sha256Url} className="text-amber underline-offset-4 hover:underline">
          {asset.sha256AssetName}
        </a>
      </p>
    </div>
  );
}
