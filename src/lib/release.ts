import { GITHUB_REPO, type ReleaseAsset } from "./site";

/**
 * Facts about the latest AorinEQ release, for the copy that sits beside the download buttons.
 *
 * The buttons themselves never wait on any of this — they point at the asset URLs, which
 * GitHub resolves on its own side. What is fetched here is only the honest labelling: which
 * version you are about to get, how big each file is, and the digest the app's own updater
 * checks before it replaces a running exe. GitHub rate-limits the API per IP, so every call is
 * cached for an hour and every failure degrades to showing less, never to a broken link.
 *
 * Each digest is read from that file's own `.sha256` sidecar, by the same name-addressed URL
 * the download uses — so a digest can only ever describe the file it is shown under.
 */

export interface LatestRelease {
  /** The release tag, e.g. `v3.3.0`. */
  tag: string;
  /** Byte size of every asset in the release, keyed by exact filename. */
  sizes: Record<string, number>;
}

interface GithubAsset {
  name?: unknown;
  size?: unknown;
}

const REVALIDATE_SECONDS = 3600;

/** Reads the release payload GitHub returns, keeping only what the page labels things with. */
export function parseLatestRelease(json: unknown): LatestRelease | null {
  if (typeof json !== "object" || json === null) return null;
  const { tag_name: tag, assets } = json as { tag_name?: unknown; assets?: unknown };
  if (typeof tag !== "string" || tag === "") return null;

  const sizes: Record<string, number> = {};
  if (Array.isArray(assets)) {
    for (const raw of assets) {
      if (typeof raw !== "object" || raw === null) continue;
      const { name, size } = raw as GithubAsset;
      if (typeof name === "string" && typeof size === "number") sizes[name] = size;
    }
  }
  return { tag, sizes };
}

/** The published size of one asset, or null when the release does not carry it under that name. */
export function assetSize(release: LatestRelease | null, asset: ReleaseAsset): number | null {
  const size = release?.sizes[asset.assetName];
  return typeof size === "number" ? size : null;
}

/** A `.sha256` sidecar is usually `<digest>  <filename>`; keep only the digest. */
export function extractDigest(text: string): string | null {
  const match = text.trim().match(/\b[0-9a-fA-F]{64}\b/);
  return match ? match[0].toLowerCase() : null;
}

export async function fetchLatestRelease(): Promise<LatestRelease | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "aorineq-web",
        },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!response.ok) return null;
    return parseLatestRelease(await response.json());
  } catch {
    return null;
  }
}

/** The SHA-256 of one download, from that download's own sidecar, or null if unreadable. */
export async function fetchAssetDigest(asset: ReleaseAsset): Promise<string | null> {
  try {
    const response = await fetch(asset.sha256Url, {
      headers: { "User-Agent": "aorineq-web" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    return extractDigest(await response.text());
  } catch {
    return null;
  }
}
