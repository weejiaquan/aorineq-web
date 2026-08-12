import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { assetSize, parseLatestRelease } from "@/lib/release";
import {
  DOWNLOADS,
  GITHUB_URL,
  INSTALLER,
  LATEST_RELEASE_URL,
  PORTABLE,
  RELEASES_URL,
  latestAssetUrl,
} from "@/lib/site";

/**
 * The download links are the one thing on this site a visitor must not have to think about, so
 * they are built in exactly one place. These tests pin the shape of those URLs, prove the two
 * builds cannot borrow each other's digest, and then walk the real source tree to prove nothing
 * else builds its own — a hardcoded copy would keep working until the day it silently pointed
 * at an old release.
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
  const base = "https://github.com/weejiaquan/aorineq/releases/latest/download";

  it("are the four links GitHub serves for the current release", () => {
    expect(INSTALLER.url).toBe(`${base}/AorinEQ-Setup.exe`);
    expect(INSTALLER.sha256Url).toBe(`${base}/AorinEQ-Setup.exe.sha256`);
    expect(PORTABLE.url).toBe(`${base}/AorinEQ.exe`);
    expect(PORTABLE.sha256Url).toBe(`${base}/AorinEQ.exe.sha256`);
  });

  it("offers the installer first, then the portable build", () => {
    expect(DOWNLOADS).toEqual([INSTALLER, PORTABLE]);
  });

  it("names each checksum sidecar after its own file, so the two cannot drift apart", () => {
    for (const asset of DOWNLOADS) {
      expect(asset.sha256AssetName).toBe(`${asset.assetName}.sha256`);
      expect(asset.sha256Url).toBe(`${asset.url}.sha256`);
    }
  });

  it("never lets one build's digest be reached through the other's name", () => {
    // The bug this guards: an installer button labelled with the portable exe's hash. Every
    // field of a download is derived from its own filename, so the two share no URL at all.
    expect(INSTALLER.assetName).not.toBe(PORTABLE.assetName);
    expect(INSTALLER.sha256Url).not.toBe(PORTABLE.sha256Url);
    expect(INSTALLER.sha256Url).toContain(INSTALLER.assetName);
    expect(PORTABLE.sha256Url).not.toContain(INSTALLER.assetName);
    // AorinEQ.exe is a substring of AorinEQ-Setup.exe.sha256 nowhere; check the reverse too.
    expect(INSTALLER.url).not.toContain(`/${PORTABLE.assetName}`);
  });

  it("keeps the human release pages distinct from the download itself", () => {
    expect(RELEASES_URL).toBe(`${GITHUB_URL}/releases`);
    expect(LATEST_RELEASE_URL).toBe(`${GITHUB_URL}/releases/latest`);
    for (const page of [RELEASES_URL, LATEST_RELEASE_URL]) {
      expect(page).not.toContain("/download/");
    }
  });
});

describe("reading the release GitHub publishes", () => {
  /** A payload shaped like the real v3.3.0 one, sizes included. */
  const payload = {
    tag_name: "v3.3.0",
    assets: [
      { name: "AorinEQ-Setup.exe", size: 69282488 },
      { name: "AorinEQ-Setup.exe.sha256", size: 83 },
      { name: "AorinEQ.exe", size: 74337460 },
      { name: "AorinEQ.exe.sha256", size: 77 },
    ],
  };

  it("keeps the tag and the size of every named asset", () => {
    const release = parseLatestRelease(payload);
    expect(release?.tag).toBe("v3.3.0");
    expect(assetSize(release, INSTALLER)).toBe(69282488);
    expect(assetSize(release, PORTABLE)).toBe(74337460);
  });

  it("gives each build its own size and never the other's", () => {
    const release = parseLatestRelease(payload);
    expect(assetSize(release, INSTALLER)).not.toBe(assetSize(release, PORTABLE));
  });

  it("reports no size for an asset the release did not publish", () => {
    const release = parseLatestRelease({ tag_name: "v9.9.9", assets: [] });
    expect(release?.tag).toBe("v9.9.9");
    expect(assetSize(release, INSTALLER)).toBeNull();
    expect(assetSize(release, PORTABLE)).toBeNull();
  });

  it("ignores assets whose name or size is not what GitHub documents", () => {
    const release = parseLatestRelease({
      tag_name: "v3.3.0",
      assets: [
        { name: "AorinEQ-Setup.exe", size: "69282488" },
        { size: 74337460 },
        null,
        { name: "AorinEQ.exe", size: 74337460 },
      ],
    });
    expect(assetSize(release, INSTALLER)).toBeNull();
    expect(assetSize(release, PORTABLE)).toBe(74337460);
  });

  it("refuses a payload with no usable tag, rather than labelling a button with nothing", () => {
    expect(parseLatestRelease({ assets: [] })).toBeNull();
    expect(parseLatestRelease({ tag_name: "" })).toBeNull();
    expect(parseLatestRelease({ tag_name: 330 })).toBeNull();
    expect(parseLatestRelease(null)).toBeNull();
    expect(parseLatestRelease("not json")).toBeNull();
  });

  it("survives a release with no asset list at all", () => {
    const release = parseLatestRelease({ tag_name: "v3.3.0" });
    expect(release?.tag).toBe("v3.3.0");
    expect(assetSize(release, INSTALLER)).toBeNull();
  });

  it("reports no size when the release could not be read", () => {
    expect(assetSize(null, INSTALLER)).toBeNull();
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

  it("makes the installer the primary control everywhere it is offered", () => {
    for (const file of [
      "components/DownloadCta.tsx",
      "components/SiteHeader.tsx",
      "components/SiteFooter.tsx",
    ]) {
      const source = read(path.join(SRC, file));
      expect(source, `${file} should link the installer via INSTALLER.url`).toContain(
        "href={INSTALLER.url}",
      );
    }
  });

  it("offers the portable build too, and never ahead of the installer", () => {
    for (const file of ["components/DownloadCta.tsx", "components/SiteFooter.tsx"]) {
      const source = read(path.join(SRC, file));
      expect(source, `${file} should offer the portable exe`).toContain("href={PORTABLE.url}");
      expect(
        source.indexOf("href={INSTALLER.url}"),
        `${file} should put the installer first`,
      ).toBeLessThan(source.indexOf("href={PORTABLE.url}"));
    }
  });

  it("gives the primary button no path through a release page", () => {
    const cta = read(path.join(SRC, "components", "DownloadCta.tsx"));
    // The release-notes link is secondary and must not be the button's own href.
    expect(cta).toContain("href={LATEST_RELEASE_URL}");
    expect(cta.indexOf("href={INSTALLER.url}")).toBeLessThan(
      cta.indexOf("href={LATEST_RELEASE_URL}"),
    );
  });

  it("labels the installer honestly, and the portable build as portable", () => {
    const cta = read(path.join(SRC, "components", "DownloadCta.tsx"));
    expect(cta, "the button should say no admin is needed").toContain(
      "installer, no admin needed",
    );
    expect(cta, "the secondary should say what portable means").toContain(
      "portable — no installer,",
    );
  });

  it("says on the install page that both builds update themselves", () => {
    const install = read(path.join(SRC, "app", "docs", "install", "page.tsx"));
    expect(install).toContain("Both update themselves.");
    expect(install, "the page should let the reader choose").toContain(
      'id="which"',
    );
  });

  it("warns about SmartScreen wherever either build is offered", () => {
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
