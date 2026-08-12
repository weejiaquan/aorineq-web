import "server-only";

import { createHash } from "node:crypto";

import { MAX_ZIP_BYTES, validateDownloadUrl } from "./protocol";

/**
 * Fetches a remote file and returns its SHA-256, without ever writing it anywhere.
 *
 * The server is being asked to fetch a URL a stranger typed, so the checks here are the point
 * of the module: only https, only public hosts, a hard byte ceiling enforced while streaming
 * rather than after the fact, and a timeout. The response body is hashed chunk by chunk and
 * discarded.
 */

const TIMEOUT_MS = 20000;

/**
 * Hostnames that must never be fetched on a visitor's behalf: loopback, link-local, and the
 * RFC1918 ranges, which on a hosting platform are where the metadata and internal services
 * live. Literal-address checks only — a name that resolves into these ranges is not caught
 * here, so nothing downstream may treat a successful fetch as proof the host is public.
 */
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    return true;
  }
  if (host === "::1" || host === "0.0.0.0") return true;
  // IPv6 unique-local and link-local.
  if (/^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)) return true;

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return false;
  const [a, b] = [Number(v4[1]), Number(v4[2])];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export type DigestResult =
  | { ok: true; sha256: string; bytes: number; contentType: string | null; finalUrl: string }
  | { ok: false; error: string };

export async function fetchDigest(rawUrl: string): Promise<DigestResult> {
  const check = validateDownloadUrl(rawUrl);
  if (!check.ok || !check.url) {
    return { ok: false, error: check.error ?? "That link cannot be used." };
  }
  const url = new URL(check.url);
  if (isBlockedHost(url.hostname)) {
    return { ok: false, error: "That host is not reachable from here. Use a public https host." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "aorineq-web link builder" },
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        ok: false,
        error: `The host answered ${response.status} ${response.statusText || ""}`.trim() + ".",
      };
    }
    if (new URL(response.url).protocol !== "https:") {
      return { ok: false, error: "That link redirected away from https." };
    }

    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_ZIP_BYTES) {
      return {
        ok: false,
        error: `That file is ${(declared / (1024 * 1024)).toFixed(1)} MB. AorinEQ refuses skin zips over 20 MB.`,
      };
    }
    if (!response.body) {
      return { ok: false, error: "The host returned no content." };
    }

    const hash = createHash("sha256");
    let bytes = 0;
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_ZIP_BYTES) {
        await reader.cancel();
        return {
          ok: false,
          error: "That file is over 20 MB, which AorinEQ refuses for skin zips.",
        };
      }
      hash.update(value);
    }
    if (bytes === 0) {
      return { ok: false, error: "That file is empty." };
    }

    return {
      ok: true,
      sha256: hash.digest("hex"),
      bytes,
      contentType: response.headers.get("content-type"),
      finalUrl: response.url,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "The host took too long to answer." };
    }
    return { ok: false, error: "That file could not be fetched. Check the link is public." };
  } finally {
    clearTimeout(timeout);
  }
}
