import { GITHUB_REPO, RELEASES_URL } from "./site";

/**
 * The latest AorinEQ release, read from the GitHub API.
 *
 * The download button shows the digest next to the file because the app's own updater checks
 * exactly that digest before it replaces the running exe — a reader can hold the site to the
 * same standard with one `Get-FileHash`. GitHub is rate-limited per IP, so the response is
 * cached for an hour and every failure degrades to a plain link to the releases page instead
 * of an error.
 */

export interface ReleaseAsset {
  name: string;
  size: number;
  downloadUrl: string;
}

export interface LatestRelease {
  tag: string;
  publishedAt: string | null;
  htmlUrl: string;
  exe: ReleaseAsset | null;
  /** Contents of AorinEQ.exe.sha256, reduced to the bare 64-hex digest. */
  sha256: string | null;
}

interface GithubAsset {
  name?: unknown;
  size?: unknown;
  browser_download_url?: unknown;
}

const REVALIDATE_SECONDS = 3600;

function toAsset(raw: GithubAsset): ReleaseAsset | null {
  if (
    typeof raw.name !== "string" ||
    typeof raw.size !== "number" ||
    typeof raw.browser_download_url !== "string"
  ) {
    return null;
  }
  return { name: raw.name, size: raw.size, downloadUrl: raw.browser_download_url };
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
    const json = (await response.json()) as {
      tag_name?: unknown;
      published_at?: unknown;
      html_url?: unknown;
      assets?: unknown;
    };
    if (typeof json.tag_name !== "string") return null;

    const assets = Array.isArray(json.assets) ? (json.assets as GithubAsset[]) : [];
    const exe = assets.map(toAsset).find((a): a is ReleaseAsset => a?.name === "AorinEQ.exe") ?? null;
    const shaAsset =
      assets.map(toAsset).find((a): a is ReleaseAsset => a?.name === "AorinEQ.exe.sha256") ?? null;

    let sha256: string | null = null;
    if (shaAsset) {
      const shaResponse = await fetch(shaAsset.downloadUrl, {
        headers: { "User-Agent": "aorineq-web" },
        next: { revalidate: REVALIDATE_SECONDS },
      });
      if (shaResponse.ok) sha256 = extractDigest(await shaResponse.text());
    }

    return {
      tag: json.tag_name,
      publishedAt: typeof json.published_at === "string" ? json.published_at : null,
      htmlUrl: typeof json.html_url === "string" ? json.html_url : RELEASES_URL,
      exe,
      sha256,
    };
  } catch {
    return null;
  }
}
