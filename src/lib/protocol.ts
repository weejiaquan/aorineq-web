/**
 * The `aorineq://` URL contract, ported from `src/AorinEQ.Core/ProtocolLink.cs` and
 * `FileNames.cs`.
 *
 * Everything here validates the way the app validates, so a link this site emits is a link
 * the app accepts. A generator that produces links the desktop app silently rejects is worse
 * than no generator at all — the failure would surface as "nothing happened" on someone
 * else's machine.
 */

export const SCHEME = "aorineq";
/** The pre-3.0 scheme. Still registered as an alias; never emit it in new links. */
export const LEGACY_SCHEME = "apo-volume";

export const INSTALL_SKIN_ACTION = "install-skin";
export const APPLY_PRESET_ACTION = "apply-preset";
export const AUTOEQ_ACTION = "autoeq";
export const OPEN_ACTION = "open";
export const EQ_PRESET_TYPE = "eq";

/** Hard cap on a whole link, matching `ProtocolLink.MaxLength`. */
export const MAX_LINK_LENGTH = 4000;
/** Cap on a name that becomes a folder or file name, matching `FileNames.MaxLength`. */
export const MAX_NAME_LENGTH = 100;
/** Cap on an `autoeq` model string, matching `ProtocolLink.MaxModelLength`. */
export const MAX_MODEL_LENGTH = 120;
/** Cap on a skin zip the app will download, matching `SkinArchive.MaxZipBytes`. */
export const MAX_ZIP_BYTES = 20 * 1024 * 1024;

export type EqScope = "device" | "global";
export type OpenPage = "eq" | "settings" | "designer" | "skins";

const RESERVED_NAMES = [
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/**
 * The nine printable characters Windows forbids in a file name. Control characters are
 * forbidden too, but the deceptive-character check runs first and already rejects them.
 */
const INVALID_FILENAME_CHARS = /["<>|:*?\\/]/;

/**
 * Characters Windows allows but which let a name lie about how it renders — bidi overrides,
 * embeddings and isolates, plus C0/C1 controls. Zero-width joiners are deliberately absent:
 * that is how emoji names are spelled.
 */
function isDeceptive(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return (
    (c <= 0x1f) ||
    (c >= 0x7f && c <= 0x9f) ||
    c === 0x200e ||
    c === 0x200f ||
    (c >= 0x202a && c <= 0x202e) ||
    (c >= 0x2066 && c <= 0x2069)
  );
}

/**
 * A readable reason the name would be rejected, or null when it is fine. `what` names the
 * thing in the message ("Skin name", "Preset name") exactly as the app does.
 */
export function validateName(name: string, what: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `${what} is too long (limit ${MAX_NAME_LENGTH} characters).`;
  }
  if (trimmed.length === 0) return `${what} cannot be empty.`;
  if ([...trimmed].some(isDeceptive)) {
    return `${what} contains characters that can disguise how it is displayed.`;
  }
  if (INVALID_FILENAME_CHARS.test(trimmed)) {
    return `${what} contains characters not allowed in file names.`;
  }
  if (trimmed.endsWith(".")) return `${what} cannot end with a dot.`;
  const stem = trimmed.split(".")[0];
  if (RESERVED_NAMES.some((r) => r.toLowerCase() === stem.toLowerCase())) {
    return `'${trimmed}' is a reserved Windows device name.`;
  }
  return null;
}

export interface UrlCheck {
  ok: boolean;
  /** The absolute URL as the app would see it, present when `ok`. */
  url?: string;
  error?: string;
}

/**
 * The download URL rules the app enforces: absolute `https`, a real host, and no credentials
 * in the URL. Anything else is refused before a link is built rather than after it is shared.
 */
export function validateDownloadUrl(raw: string): UrlCheck {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, error: "Enter a link to the file." };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "That isn't a valid URL. Include the https:// prefix." };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "The link must use https. AorinEQ refuses http and file links." };
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    return { ok: false, error: "The link must not carry a username or password." };
  }
  if (parsed.hostname.length === 0) {
    return { ok: false, error: "The link has no host." };
  }
  return { ok: true, url: parsed.toString() };
}

/** Exactly 64 hex characters, normalized to lowercase — or null when it isn't a digest. */
export function normalizeSha256(value: string): string | null {
  const trimmed = value.trim();
  return /^[0-9a-fA-F]{64}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

/** The filename stem the app would derive from a URL when the link carries no `name`. */
export function nameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const file = decodeURIComponent(path.slice(path.lastIndexOf("/") + 1));
    const dot = file.lastIndexOf(".");
    return (dot > 0 ? file.slice(0, dot) : file).trim();
  } catch {
    return "";
  }
}

export interface InstallSkinLink {
  url: string;
  name?: string;
  sha256?: string;
}

/** `aorineq://install-skin?url=…&name=…&sha256=…` */
export function buildInstallSkinLink(link: InstallSkinLink): string {
  const parts = [`url=${encodeURIComponent(link.url)}`];
  if (link.name) parts.push(`name=${encodeURIComponent(link.name)}`);
  if (link.sha256) parts.push(`sha256=${link.sha256}`);
  return `${SCHEME}://${INSTALL_SKIN_ACTION}?${parts.join("&")}`;
}

export interface ApplyPresetInline {
  data: string;
  name?: string;
  scope?: EqScope;
}

/** `aorineq://apply-preset?type=eq&data=…` — the whole preset rides inside the link. */
export function buildApplyPresetInlineLink(link: ApplyPresetInline): string {
  const parts = [`type=${EQ_PRESET_TYPE}`, `data=${link.data}`];
  if (link.name) parts.push(`name=${encodeURIComponent(link.name)}`);
  if (link.scope && link.scope !== "device") parts.push(`scope=${link.scope}`);
  return `${SCHEME}://${APPLY_PRESET_ACTION}?${parts.join("&")}`;
}

export interface ApplyPresetHosted {
  url: string;
  name?: string;
  scope?: EqScope;
  sha256?: string;
}

/** `aorineq://apply-preset?type=eq&url=…` — the preset is a hosted ParametricEQ .txt. */
export function buildApplyPresetHostedLink(link: ApplyPresetHosted): string {
  const parts = [`type=${EQ_PRESET_TYPE}`, `url=${encodeURIComponent(link.url)}`];
  if (link.name) parts.push(`name=${encodeURIComponent(link.name)}`);
  if (link.scope && link.scope !== "device") parts.push(`scope=${link.scope}`);
  if (link.sha256) parts.push(`sha256=${link.sha256}`);
  return `${SCHEME}://${APPLY_PRESET_ACTION}?${parts.join("&")}`;
}

/** `aorineq://autoeq?model=…` */
export function buildAutoEqLink(model: string): string {
  return `${SCHEME}://${AUTOEQ_ACTION}?model=${encodeURIComponent(model.trim())}`;
}

/** `aorineq://open?page=…` */
export function buildOpenLink(page: OpenPage): string {
  return `${SCHEME}://${OPEN_ACTION}?page=${page}`;
}

/** Whether a built link is short enough for the app to accept it. */
export function fitsLinkLimit(link: string): boolean {
  return link.length <= MAX_LINK_LENGTH;
}
