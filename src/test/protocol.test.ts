import { describe, expect, it } from "vitest";

import {
  MAX_LINK_LENGTH,
  forDisplay,
  isDeceptive,
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

describe("isDeceptive", () => {
  // Written as code points rather than literals: these characters are invisible or reorder the
  // text around them, so a source file containing them could not be read or reviewed.
  it("names the characters that let text lie about how it renders", () => {
    const deceptive = [
      0x00, 0x1f, // C0 controls
      0x7f, 0x9f, // DEL and the C1 controls
      0x200e, 0x200f, // left-to-right and right-to-left marks
      0x202a, 0x202e, // bidi embeddings and overrides
      0x2066, 0x2069, // bidi isolates
    ];
    for (const point of deceptive) {
      const label = `U+${point.toString(16).padStart(4, "0")}`;
      expect(isDeceptive(String.fromCodePoint(point)), label).toBe(true);
    }
  });

  it("leaves ordinary text, emoji and the joiner that spells them alone", () => {
    // The zero-width joiner (U+200D) is deliberately absent from the rule: it is how emoji are
    // spelled, and dropping it would rewrite an author's name into a different one.
    const ordinary = [0x61, 0x20, 0xe9, 0x3042, 0x200d, 0x1f600];
    for (const point of ordinary) {
      const label = `U+${point.toString(16).padStart(4, "0")}`;
      expect(isDeceptive(String.fromCodePoint(point)), label).toBe(false);
    }
  });
});

describe("forDisplay", () => {
  it("returns anything already inside the cap unchanged", () => {
    expect(forDisplay("mika bar", 80)).toBe("mika bar");
    expect(forDisplay("abcde", 5)).toBe("abcde");
  });

  it("ellipsizes past the cap, counting the ellipsis inside it", () => {
    expect(forDisplay("abcdef", 5)).toBe("abcd…");
    expect(forDisplay("abcdef", 5)).toHaveLength(5);
  });

  it("counts text elements, so a cap never splits a grapheme in half", () => {
    // One family emoji is 8 UTF-16 units and 1 text element. A code-unit cap would cut a
    // surrogate pair and leave a replacement box on a public page.
    const family = "\u{1f468}‍\u{1f469}‍\u{1f467}";
    expect(family).toHaveLength(8);
    expect(forDisplay(family.repeat(5), 5)).toBe(`${family.repeat(4)}…`);
    expect(forDisplay(family.repeat(2), 3)).toBe(family.repeat(2));
  });

  it("ellipsizes a value that exactly fills the cap, as the app does", () => {
    // The app reserves the last slot for the ellipsis before it knows whether anything follows,
    // so a value of exactly `maxLength` elements that is longer in code units loses its last
    // one. Ported as-is: a credit must read the same here as it does in the skin picker.
    expect(forDisplay("abcde", 5)).toBe("abcde"); // short in code units too: untouched
    expect(forDisplay("ééééé", 5)).toBe("ééééé"); // 5 units, 5 elements: also untouched
    expect(forDisplay("👍👍👍", 3)).toBe("👍👍…"); // 6 units, 3 elements: the cap bites
  });

  it("returns nothing when there is no room to say anything", () => {
    expect(forDisplay("abc", 0)).toBe("");
    expect(forDisplay("abc", -1)).toBe("");
  });
});
