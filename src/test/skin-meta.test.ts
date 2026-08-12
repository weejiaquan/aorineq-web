import { describe, expect, it } from "vitest";

import {
  MAX_AUTHOR_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_SOURCE_URL_LENGTH,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_VERSION_LENGTH,
  parseSkinMeta,
} from "@/lib/skin-meta";

/**
 * These strings arrive from a file someone else wrote and are rendered on a public page under
 * their name. The rules are the desktop app's, so a credit reads identically in the skin picker
 * and in the gallery; the cases below are the ones where a naive reader would publish something
 * other than what the author wrote.
 */

const NONE = {
  title: null,
  author: null,
  description: null,
  version: null,
  tags: [],
  sourceUrl: null,
};

describe("parseSkinMeta", () => {
  it("reads the metadata this gallery's own skin ships", () => {
    expect(parseSkinMeta({ title: "mika bar", author: "lychwee", version: "1" })).toEqual({
      ...NONE,
      title: "mika bar",
      author: "lychwee",
      version: "1",
    });
  });

  it("treats a skin with no metadata, and a missing file, as unsigned rather than broken", () => {
    expect(parseSkinMeta({})).toEqual(NONE);
    expect(parseSkinMeta(null)).toEqual(NONE);
    expect(parseSkinMeta(undefined)).toEqual(NONE);
  });

  it("ignores a value of the wrong type instead of failing the whole skin", () => {
    // The app deserializes these as raw JSON elements precisely so that a number in a credit
    // line cannot stop a skin from loading.
    expect(parseSkinMeta({ title: 42, author: true, tags: "bar", sourceUrl: 7 })).toEqual(NONE);
  });

  it("trims, and reads blank as absent", () => {
    expect(parseSkinMeta({ title: "  mika bar  ", author: "   " })).toEqual({
      ...NONE,
      title: "mika bar",
    });
  });

  it("keeps a one-line credit on one line", () => {
    const meta = parseSkinMeta({ author: "lych\r\nwee\tand\nfriends" });
    expect(meta.author).toBe("lych wee and friends");
  });

  it("normalizes every line ending in a description to a single \\n", () => {
    const meta = parseSkinMeta({ description: "first\r\nsecond\rthird\nfourth" });
    expect(meta.description).toBe("first\nsecond\nthird\nfourth");
  });

  it("drops the characters that make a credit render as something it does not say", () => {
    // U+202E reverses everything after it, so one invisible character in a byline could make it
    // claim any author at all. Built from its code point because a literal would reorder the
    // source line it sits in.
    const override = String.fromCodePoint(0x202e);
    const meta = parseSkinMeta({ author: `lych${override}wee` });
    expect(meta.author).toBe("lychwee");
  });

  it("caps each field at the length the app caps it, by text element", () => {
    const meta = parseSkinMeta({
      title: "t".repeat(MAX_TITLE_LENGTH + 20),
      author: "a".repeat(MAX_AUTHOR_LENGTH + 20),
      description: "d".repeat(MAX_DESCRIPTION_LENGTH + 20),
      version: "v".repeat(MAX_VERSION_LENGTH + 20),
    });
    expect(meta.title).toHaveLength(MAX_TITLE_LENGTH);
    expect(meta.author).toHaveLength(MAX_AUTHOR_LENGTH);
    expect(meta.description).toHaveLength(MAX_DESCRIPTION_LENGTH);
    expect(meta.version).toHaveLength(MAX_VERSION_LENGTH);
    expect(meta.title?.endsWith("…")).toBe(true);
  });

  it("keeps a version as the author's own string, never a number", () => {
    expect(parseSkinMeta({ version: "2024-03" }).version).toBe("2024-03");
    expect(parseSkinMeta({ version: 1 }).version).toBeNull();
  });
});

describe("parseSkinMeta tags", () => {
  it("trims each tag and drops the empty ones", () => {
    expect(parseSkinMeta({ tags: ["  bar ", "", "   ", "pink"] }).tags).toEqual(["bar", "pink"]);
  });

  it("de-duplicates case-insensitively, keeping the first spelling", () => {
    expect(parseSkinMeta({ tags: ["Bar", "bar", "BAR", "pink"] }).tags).toEqual(["Bar", "pink"]);
  });

  it("skips entries that are not strings rather than rejecting the array", () => {
    expect(parseSkinMeta({ tags: ["bar", 5, null, "pink"] }).tags).toEqual(["bar", "pink"]);
  });

  it("stops at the tag limit and caps each tag's length", () => {
    const many = Array.from({ length: MAX_TAGS + 5 }, (_, i) => `tag${i}`);
    expect(parseSkinMeta({ tags: many }).tags).toHaveLength(MAX_TAGS);
    expect(parseSkinMeta({ tags: ["x".repeat(MAX_TAG_LENGTH + 10)] }).tags[0]).toHaveLength(
      MAX_TAG_LENGTH,
    );
  });
});

describe("parseSkinMeta sourceUrl", () => {
  it("keeps an https link verbatim, without re-escaping what the author chose", () => {
    const url = "https://example.com/art/mika%20bar?ref=a+b";
    expect(parseSkinMeta({ sourceUrl: url }).sourceUrl).toBe(url);
  });

  it("drops anything the app would refuse to publish as a link", () => {
    for (const bad of [
      "http://example.com",
      "ftp://example.com",
      "https://user:pw@example.com",
      "javascript:alert(1)",
      "example.com",
      "   ",
    ]) {
      expect(parseSkinMeta({ sourceUrl: bad }).sourceUrl, bad).toBeNull();
    }
  });

  it("drops an over-long URL rather than truncating it into a different destination", () => {
    const long = `https://example.com/${"a".repeat(MAX_SOURCE_URL_LENGTH)}`;
    expect(parseSkinMeta({ sourceUrl: long }).sourceUrl).toBeNull();
  });
});
