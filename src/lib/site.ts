/** Site-wide constants and the absolute origin the `aorineq://` install links point back at. */

export const SITE_NAME = "AorinEQ";
export const SITE_TAGLINE = "Working volume keys, a skinnable OSD, and a real parametric EQ for Windows.";
export const GITHUB_REPO = "weejiaquan/aorineq";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
export const RELEASES_URL = `${GITHUB_URL}/releases/latest`;
export const ISSUES_URL = `${GITHUB_URL}/issues`;
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
