import { EXE_ASSET_NAME, GITHUB_REPO, SHA256_URL } from "./site";

/**
 * Facts about the latest AorinEQ release, for the copy that sits beside the download button.
 *
 * The button itself never waits on any of this — it points at `DOWNLOAD_URL`, which GitHub
 * resolves on its own side. What is fetched here is only the honest labelling: which version
 * you are about to get, how big it is, and the digest the app's own updater checks before it
 * replaces a running exe. GitHub rate-limits the API per IP, so every call is cached for an
 * hour and every failure degrades to showing less, never to a broken link.
 *
 * The digest is read from the `.sha256` sidecar by the same name-addressed URL the exe uses,
 * not from the API's asset list, so the two always describe the same file.
 */

export interface LatestRelease {
  /** The release tag, e.g. `v1.4.0`. */
  tag: string;
  /** Size of AorinEQ.exe in bytes, or null if the release has no asset under that name. */
  exeSize: number | null;
}

interface GithubAsset {
  name?: unknown;
  size?: unknown;
}

const REVALIDATE_SECONDS = 3600;

/** The size of the exe asset in a release payload's asset list, by exact name. */
function exeSizeOf(assets: unknown): number | null {
  if (!Array.isArray(assets)) return null;
  for (const raw of assets as GithubAsset[]) {
    if (raw.name === EXE_ASSET_NAME && typeof raw.size === "number") return raw.size;
  }
  return null;
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
    const json = (await response.json()) as { tag_name?: unknown; assets?: unknown };
    if (typeof json.tag_name !== "string") return null;
    return { tag: json.tag_name, exeSize: exeSizeOf(json.assets) };
  } catch {
    return null;
  }
}

/** The SHA-256 of the exe the download button hands out, or null if the sidecar is unreadable. */
export async function fetchLatestDigest(): Promise<string | null> {
  try {
    const response = await fetch(SHA256_URL, {
      headers: { "User-Agent": "aorineq-web" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    return extractDigest(await response.text());
  } catch {
    return null;
  }
}
