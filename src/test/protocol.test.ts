import { describe, expect, it } from "vitest";

import {
  MAX_LINK_LENGTH,
  buildApplyPresetHostedLink,
  buildApplyPresetInlineLink,
  buildAutoEqLink,
  buildInstallSkinLink,
  buildOpenLink,
  fitsLinkLimit,
  nameFromUrl,
  normalizeSha256,
  validateDownloadUrl,
  validateName,
} from "@/lib/protocol";

describe("validateName", () => {
  it("accepts the names people actually use", () => {
    expect(validateName("seia-bar-shadow", "Skin name")).toBeNull();
    expect(validateName("HD 650 correction", "Preset name")).toBeNull();
    expect(validateName("にゃんこ", "Skin name")).toBeNull();
    expect(validateName("cat.v2", "Skin name")).toBeNull();
  });

  it("trims before judging", () => {
    expect(validateName("  neon-bar  ", "Skin name")).toBeNull();
    expect(validateName("   ", "Skin name")).toBe("Skin name cannot be empty.");
  });

  it("rejects characters Windows forbids in a file name", () => {
    for (const bad of ['a"b', "a<b", "a>b", "a|b", "a:b", "a*b", "a?b", "a\\b", "a/b"]) {
      expect(validateName(bad, "Skin name")).toBe(
        "Skin name contains characters not allowed in file names.",
      );
    }
  });

  it("rejects bidi overrides that let a name lie about how it renders", () => {
    expect(validateName("gp\u202Egnp.exe", "Skin name")).toBe(
      "Skin name contains characters that can disguise how it is displayed.",
    );
    expect(validateName("a\u0000b", "Skin name")).toBe(
      "Skin name contains characters that can disguise how it is displayed.",
    );
  });

  it("rejects a trailing dot, which Windows silently strips", () => {
    expect(validateName("skin.", "Skin name")).toBe("Skin name cannot end with a dot.");
  });

  it("rejects reserved device names, bare or with an extension", () => {
    expect(validateName("NUL", "Skin name")).toBe("'NUL' is a reserved Windows device name.");
    expect(validateName("com1.png", "Skin name")).toBe(
      "'com1.png' is a reserved Windows device name.",
    );
    expect(validateName("console", "Skin name")).toBeNull();
  });

  it("rejects names past the 100-character limit", () => {
    expect(validateName("x".repeat(100), "Skin name")).toBeNull();
    expect(validateName("x".repeat(101), "Skin name")).toBe(
      "Skin name is too long (limit 100 characters).",
    );
  });

  it("names the thing in the message", () => {
    expect(validateName("", "Preset name")).toBe("Preset name cannot be empty.");
  });
});

describe("validateDownloadUrl", () => {
  it("accepts a plain https URL", () => {
    const result = validateDownloadUrl("https://example.com/skins/neon-bar.zip");
    expect(result.ok).toBe(true);
    expect(result.url).toBe("https://example.com/skins/neon-bar.zip");
  });

  it("refuses http, file and other schemes the app rejects", () => {
    expect(validateDownloadUrl("http://example.com/a.zip").ok).toBe(false);
    expect(validateDownloadUrl("file:///C:/a.zip").ok).toBe(false);
    expect(validateDownloadUrl("ftp://example.com/a.zip").ok).toBe(false);
  });

  it("refuses credentials in the URL", () => {
    const result = validateDownloadUrl("https://user:pass@example.com/a.zip");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/username or password/);
  });

  it("explains an empty or unparseable value instead of failing silently", () => {
    expect(validateDownloadUrl("").error).toMatch(/Enter a link/);
    expect(validateDownloadUrl("example.com/a.zip").error).toMatch(/https:\/\/ prefix/);
  });
});

describe("normalizeSha256", () => {
  it("lowercases a valid digest", () => {
    const upper = "B2626AFB228A953B6AC854C69DBC45BA19D1FBF8427B7379823005A1252A0B33";
    expect(normalizeSha256(upper)).toBe(upper.toLowerCase());
  });

  it("rejects anything that is not exactly 64 hex characters", () => {
    expect(normalizeSha256("abc")).toBeNull();
    expect(normalizeSha256("z".repeat(64))).toBeNull();
    expect(normalizeSha256("a".repeat(65))).toBeNull();
  });
});

describe("nameFromUrl", () => {
  it("takes the filename stem, the way the app does when no name is given", () => {
    expect(nameFromUrl("https://example.com/skins/neon-bar.zip")).toBe("neon-bar");
    expect(nameFromUrl("https://example.com/a/b/cat.v2.zip")).toBe("cat.v2");
    expect(nameFromUrl("https://example.com/plain")).toBe("plain");
  });

  it("percent-decodes the stem", () => {
    expect(nameFromUrl("https://example.com/skins/neon%20bar.zip")).toBe("neon bar");
  });

  it("returns nothing usable for a nonsense URL", () => {
    expect(nameFromUrl("not a url")).toBe("");
  });
});

describe("link builders", () => {
  it("builds an install-skin link with the URL percent-encoded", () => {
    expect(
      buildInstallSkinLink({
        url: "https://example.com/skins/neon bar.zip",
        name: "neon-bar",
        sha256: "a".repeat(64),
      }),
    ).toBe(
      `aorineq://install-skin?url=https%3A%2F%2Fexample.com%2Fskins%2Fneon%20bar.zip&name=neon-bar&sha256=${"a".repeat(64)}`,
    );
  });

  it("omits optional install-skin parameters that were not given", () => {
    expect(buildInstallSkinLink({ url: "https://example.com/a.zip" })).toBe(
      "aorineq://install-skin?url=https%3A%2F%2Fexample.com%2Fa.zip",
    );
  });

  it("builds an inline apply-preset link and leaves the base64url payload unescaped", () => {
    expect(
      buildApplyPresetInlineLink({ data: "djF8LTYuMXxMU0M-XzE", name: "HD 650" }),
    ).toBe("aorineq://apply-preset?type=eq&data=djF8LTYuMXxMU0M-XzE&name=HD%20650");
  });

  it("only writes scope when it is not the default", () => {
    expect(buildApplyPresetInlineLink({ data: "x", scope: "device" })).toBe(
      "aorineq://apply-preset?type=eq&data=x",
    );
    expect(buildApplyPresetInlineLink({ data: "x", scope: "global" })).toBe(
      "aorineq://apply-preset?type=eq&data=x&scope=global",
    );
  });

  it("builds a hosted apply-preset link with a digest pin", () => {
    expect(
      buildApplyPresetHostedLink({
        url: "https://example.com/HD650.txt",
        name: "HD650",
        sha256: "b".repeat(64),
      }),
    ).toBe(
      `aorineq://apply-preset?type=eq&url=https%3A%2F%2Fexample.com%2FHD650.txt&name=HD650&sha256=${"b".repeat(64)}`,
    );
  });

  it("builds autoeq and open links", () => {
    expect(buildAutoEqLink(" Sennheiser HD 650 ")).toBe(
      "aorineq://autoeq?model=Sennheiser%20HD%20650",
    );
    expect(buildOpenLink("designer")).toBe("aorineq://open?page=designer");
  });
});

describe("fitsLinkLimit", () => {
  it("accepts a link at the limit and refuses one past it", () => {
    expect(fitsLinkLimit("a".repeat(MAX_LINK_LENGTH))).toBe(true);
    expect(fitsLinkLimit("a".repeat(MAX_LINK_LENGTH + 1))).toBe(false);
  });
});
