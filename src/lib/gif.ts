/**
 * Minimal GIF header reader, the animated counterpart to {@link readPngSize} in `png.ts`.
 *
 * The demo captures on this site are GIFs, and the page reserves each one's box from its real
 * pixel size rather than from a number typed into a component — a declared size that disagreed
 * with the file would either squash the capture or shift the layout as it decodes, which is the
 * one thing an above-the-fold image must never do.
 */

/** "GIF87a" and "GIF89a" — the only two versions, and both carry the same screen descriptor. */
const SIGNATURE = "GIF8";
const VERSIONS = ["7a", "9a"];

/**
 * The logical screen descriptor's dimensions, or null when the bytes are not a GIF.
 *
 * Unlike PNG's big-endian IHDR, GIF is little-endian and the size sits at bytes 6..10.
 */
export function readGifSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 10) return null;
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, 6));
  if (!header.startsWith(SIGNATURE) || !VERSIONS.includes(header.slice(4))) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  return width > 0 && height > 0 ? { width, height } : null;
}
