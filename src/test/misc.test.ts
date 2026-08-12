import { describe, expect, it } from "vitest";

import { MUTE_DB, formatDb, toDb } from "@/lib/volume";
import { extractDigest } from "@/lib/release";
import { isBlockedHost } from "@/lib/remote-digest";
import { formatBytes } from "@/lib/site";

describe("the volume model", () => {
  it("matches the three documented anchor points", () => {
    expect(toDb(0)).toBe(MUTE_DB);
    expect(toDb(1)).toBeCloseTo(-50, 9);
    expect(toDb(100)).toBeCloseTo(0, 9);
  });

  it("is linear in dB between 1% and 100%, about half a dB per percent", () => {
    const step = toDb(51) - toDb(50);
    expect(step).toBeCloseTo(50 / 99, 9);
    expect(toDb(75) - toDb(74)).toBeCloseTo(step, 9);
  });

  it("never goes above 0 dB, so the chain cannot clip", () => {
    for (let p = 0; p <= 100; p++) {
      expect(toDb(p)).toBeLessThanOrEqual(0);
    }
  });

  it("mutes to the floor regardless of percent", () => {
    expect(toDb(100, true)).toBe(MUTE_DB);
    expect(toDb(50, true)).toBe(MUTE_DB);
  });

  it("formats with a real minus sign and an infinity floor", () => {
    expect(formatDb(toDb(0))).toBe("−∞ dB");
    expect(formatDb(toDb(100))).toBe("0.0 dB");
    expect(formatDb(-29.04)).toBe("−29.0 dB");
  });
});

describe("extractDigest", () => {
  it("reads the digest out of a checksum sidecar", () => {
    const digest = "b2626afb228a953b6ac854c69dbc45ba19d1fbf8427b7379823005a1252a0b33";
    expect(extractDigest(`${digest}  AorinEQ.exe\n`)).toBe(digest);
    expect(extractDigest(`${digest.toUpperCase()} *AorinEQ.exe`)).toBe(digest);
    expect(extractDigest(`  ${digest}  `)).toBe(digest);
  });

  it("returns null when there is no digest in the text", () => {
    expect(extractDigest("404: Not Found")).toBeNull();
    expect(extractDigest("abc123")).toBeNull();
  });
});

describe("isBlockedHost", () => {
  it("allows ordinary public hosts", () => {
    for (const host of ["example.com", "github.com", "files.catbox.moe", "8.8.8.8"]) {
      expect(isBlockedHost(host)).toBe(false);
    }
  });

  it("blocks loopback by name and by address", () => {
    expect(isBlockedHost("localhost")).toBe(true);
    expect(isBlockedHost("app.localhost")).toBe(true);
    expect(isBlockedHost("127.0.0.1")).toBe(true);
    expect(isBlockedHost("127.1.2.3")).toBe(true);
    expect(isBlockedHost("::1")).toBe(true);
    expect(isBlockedHost("[::1]")).toBe(true);
  });

  it("blocks the RFC1918 ranges", () => {
    expect(isBlockedHost("10.0.0.1")).toBe(true);
    expect(isBlockedHost("192.168.1.1")).toBe(true);
    expect(isBlockedHost("172.16.0.1")).toBe(true);
    expect(isBlockedHost("172.31.255.255")).toBe(true);
    expect(isBlockedHost("172.15.0.1")).toBe(false);
    expect(isBlockedHost("172.32.0.1")).toBe(false);
  });

  it("blocks link-local, carrier-grade NAT and platform-internal names", () => {
    expect(isBlockedHost("169.254.169.254")).toBe(true);
    expect(isBlockedHost("100.64.0.1")).toBe(true);
    expect(isBlockedHost("metadata.internal")).toBe(true);
    expect(isBlockedHost("fd00::1")).toBe(true);
    expect(isBlockedHost("fe80::1")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isBlockedHost("LOCALHOST")).toBe(true);
  });
});

describe("formatBytes", () => {
  it("picks a unit a person can read at a glance", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1040293)).toBe("1016 KB"); // just under a mebibyte, so still KB
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(65 * 1024 * 1024)).toBe("65.0 MB");
  });
});
