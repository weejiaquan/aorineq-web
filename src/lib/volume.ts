/**
 * The volume model, ported from `src/AorinEQ.Core/VolumeState.cs`.
 *
 * A Windows-style 0-100% mapped linearly in dB onto the Equalizer APO preamp: 0% is a hard
 * mute at -120 dB, 1% is -50 dB, 100% is 0 dB. Never above 0 dB, so the chain cannot clip.
 */

export const MUTE_DB = -120;
export const MIN_DB = -50;

/** The preamp value AorinEQ writes for a given percent. */
export function toDb(percent: number, muted = false): number {
  if (muted || percent <= 0) return MUTE_DB;
  return (MIN_DB * (100 - percent)) / 99;
}

/** dB formatted the way the app's readouts show it: one decimal, a real minus sign. */
export function formatDb(db: number): string {
  if (db <= MUTE_DB) return "−∞ dB";
  const rounded = db.toFixed(1);
  return rounded.startsWith("-")
    ? `−${rounded.slice(1)} dB`
    : `${rounded === "0.0" ? "0.0" : rounded} dB`;
}
