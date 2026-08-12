/** Site-wide constants and the absolute origin the `aorineq://` install links point back at. */

export const SITE_NAME = "AorinEQ";
export const SITE_TAGLINE = "Working volume keys, a skinnable OSD, and a real parametric EQ for Windows.";
export const GITHUB_REPO = "weejiaquan/aorineq";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const LATEST_RELEASE_URL = `${GITHUB_URL}/releases/latest`;
export const ISSUES_URL = `${GITHUB_URL}/issues`;

/**
 * The exact filenames a release must publish. `latestAssetUrl` addresses an asset by name
 * rather than by tag, so a release that renames the exe breaks every download button on this
 * site silently — the link 404s and nothing here can tell. Renaming these is a release-process
 * change, not a website change.
 */
export const EXE_ASSET_NAME = "AorinEQ.exe";
export const SHA256_ASSET_NAME = `${EXE_ASSET_NAME}.sha256`;

/**
 * A direct link to one asset of whatever release is newest.
 *
 * GitHub resolves `/releases/latest/download/<name>` server-side and answers with the file
 * itself under `Content-Disposition: attachment` — no release page, no asset list, no second
 * click. Every download control on the site points here; nothing builds its own URL.
 */
export function latestAssetUrl(assetName: string): string {
  return `${GITHUB_URL}/releases/latest/download/${encodeURIComponent(assetName)}`;
}

/** The one URL every primary download control uses. */
export const DOWNLOAD_URL = latestAssetUrl(EXE_ASSET_NAME);
/** The checksum sidecar for the same build, for readers who want to verify before running. */
export const SHA256_URL = latestAssetUrl(SHA256_ASSET_NAME);
export const EAPO_URL = "https://equalizerapo.com";
export const AUTOEQ_URL = "https://github.com/jaakkopasanen/AutoEq";

/** The address a takedown or report goes to. Replace before relying on the policy pages. */
export const CONTACT_EMAIL = "REPLACE-ME@example.com";
export const CONTACT_IS_PLACEHOLDER = CONTACT_EMAIL.startsWith("REPLACE-ME");

/**
 * The site's absolute origin, needed because `aorineq://install-skin` carries an absolute
 * https URL to the file. On Vercel the production domain is in the environment at build time;
 * locally there is no https origin, so links built in dev are honestly marked as such.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** An absolute URL for a path under `public/`. */
export function absoluteUrl(pathname: string): string {
  return `${siteUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/** Bytes as a short human size, for download buttons. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
