/**
 * Minimal PNG header reader, mirroring `src/AorinEQ.Core/PngHeader.cs`.
 *
 * The gallery reads each skin's real pixel size out of the file instead of trusting a number
 * typed into the manifest — a manifest that disagrees with the artwork would place the fill
 * range and the percent text in the wrong spot, which is exactly the bug a preview exists to
 * rule out.
 */

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export interface PngSize {
  width: number;
  height: number;
}

/** The IHDR dimensions, or null when the bytes are not a PNG. */
export function readPngSize(bytes: Uint8Array): PngSize | null {
  if (bytes.length < 24) return null;
  for (let i = 0; i < SIGNATURE.length; i++) {
    if (bytes[i] !== SIGNATURE[i]) return null;
  }
  // Bytes 12..16 are the chunk type of the first chunk, which must be IHDR.
  if (
    bytes[12] !== 0x49 ||
    bytes[13] !== 0x48 ||
    bytes[14] !== 0x44 ||
    bytes[15] !== 0x52
  ) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return width > 0 && height > 0 ? { width, height } : null;
}
