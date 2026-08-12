import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  DOWNLOAD_URL,
  EXE_ASSET_NAME,
  GITHUB_URL,
  LATEST_RELEASE_URL,
  RELEASES_URL,
  SHA256_ASSET_NAME,
  SHA256_URL,
  latestAssetUrl,
} from "@/lib/site";

/**
 * The download link is the one thing on this site a visitor must not have to think about, so
 * it is built in exactly one place. These tests pin the shape of that URL and then walk the
 * real source tree to prove nothing else builds its own — a hardcoded copy would keep working
 * until the day it silently pointed at an old release.
 */

const SRC = path.join(process.cwd(), "src");

/** Every source file under a directory, recursively. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function read(file: string): string {
  return readFileSync(file, "utf8");
}

function relative(file: string): string {
  return path.relative(process.cwd(), file).replace(/\\/g, "/");
}

describe("latestAssetUrl", () => {
  it("addresses an asset by name, with no version anywhere in the path", () => {
    const url = latestAssetUrl("Thing.exe");
    expect(url).toBe(`${GITHUB_URL}/releases/latest/download/Thing.exe`);
    // A tag in the URL is the bug this function exists to prevent: it would freeze the button
    // on whatever release was current when the page was built.
    expect(url).not.toMatch(/\bv?\d+\.\d+\.\d+\b/);
  });

  it("percent-encodes a name that would otherwise break the path", () => {
    expect(latestAssetUrl("My App.exe")).toBe(
      `${GITHUB_URL}/releases/latest/download/My%20App.exe`,
    );
  });
});

describe("the published asset URLs", () => {
  it("are the two links GitHub serves for the current release", () => {
    expect(DOWNLOAD_URL).toBe(
      "https://github.com/weejiaquan/aorineq/releases/latest/download/AorinEQ.exe",
    );
    expect(SHA256_URL).toBe(
      "https://github.com/weejiaquan/aorineq/releases/latest/download/AorinEQ.exe.sha256",
    );
  });

  it("names the checksum sidecar after the exe, so the two cannot drift apart", () => {
    expect(EXE_ASSET_NAME).toBe("AorinEQ.exe");
    expect(SHA256_ASSET_NAME).toBe(`${EXE_ASSET_NAME}.sha256`);
    expect(SHA256_URL).toBe(`${DOWNLOAD_URL}.sha256`);
  });

  it("keeps the human release pages distinct from the download itself", () => {
    expect(RELEASES_URL).toBe(`${GITHUB_URL}/releases`);
    expect(LATEST_RELEASE_URL).toBe(`${GITHUB_URL}/releases/latest`);
    for (const page of [RELEASES_URL, LATEST_RELEASE_URL]) {
      expect(page).not.toContain("/download/");
    }
  });
});

describe("the source tree", () => {
  const ui = [...sourceFiles(path.join(SRC, "app")), ...sourceFiles(path.join(SRC, "components"))];

  it("has UI files to check", () => {
    expect(ui.length).toBeGreaterThan(10);
  });

  it("lets no page or component write a github.com URL of its own", () => {
    const offenders = ui.filter((file) => read(file).includes("github.com")).map(relative);
    expect(
      offenders,
      "GitHub URLs belong in src/lib/site.ts so there is one place to change them",
    ).toEqual([]);
  });

  it("builds the latest/download path in exactly one file", () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => relative(file) !== "src/lib/site.ts")
      .filter((file) => read(file).includes("releases/latest/download"))
      // The test itself states the expected URLs; that is the point of it.
      .filter((file) => relative(file) !== "src/test/download.test.ts")
      .map(relative);
    expect(offenders).toEqual([]);
  });

  it("points every download control at the shared constant", () => {
    for (const file of ["components/DownloadCta.tsx", "components/SiteHeader.tsx", "components/SiteFooter.tsx"]) {
      const source = read(path.join(SRC, file));
      expect(source, `${file} should link the exe via DOWNLOAD_URL`).toContain(
        "href={DOWNLOAD_URL}",
      );
    }
  });

  it("gives the primary button no path through a release page", () => {
    const cta = read(path.join(SRC, "components", "DownloadCta.tsx"));
    // The release-notes link is secondary and must not be the button's own href.
    expect(cta).toContain("href={LATEST_RELEASE_URL}");
    expect(cta.indexOf("href={DOWNLOAD_URL}")).toBeLessThan(cta.indexOf("href={LATEST_RELEASE_URL}"));
  });

  it("warns about SmartScreen wherever the exe is offered", () => {
    const cta = read(path.join(SRC, "components", "DownloadCta.tsx"));
    const install = read(path.join(SRC, "app", "docs", "install", "page.tsx"));
    for (const [name, source] of [
      ["DownloadCta", cta],
      ["docs/install", install],
    ] as const) {
      expect(source, `${name} should name the exact wording Windows shows`).toContain(
        "Windows protected your PC",
      );
      expect(source, `${name} should say how to get past it`).toContain("Run anyway");
    }
    // The compact button has no room for the panel, so it links to the section that has it.
    expect(cta).toContain("/docs/install#smartscreen");
    expect(install).toContain('id="smartscreen"');
  });
});
