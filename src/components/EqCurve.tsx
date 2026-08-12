import { logFrequencies, responseDb, MAX_FREQUENCY, MIN_FREQUENCY } from "@/lib/eq-response";
import type { EqBand } from "@/lib/eq";

/**
 * The summed response of a band chain, drawn from the same RBJ biquad math the app uses.
 *
 * Pure and dependency-free, so the landing page renders it on the server with no JavaScript
 * while the preset builder re-renders it on every edit.
 */

const WIDTH = 640;
const HEIGHT = 220;
const PAD_L = 34;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 22;
const SAMPLES = 320;

const FREQ_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

function tickLabel(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : String(hz);
}

export interface EqCurveProps {
  bands: readonly EqBand[];
  /** Extra label under the curve, e.g. the suggested preamp. */
  caption?: string;
  className?: string;
}

export function EqCurve({ bands, caption, className }: EqCurveProps) {
  const freqs = logFrequencies(SAMPLES);
  const response = responseDb(bands, freqs);

  const peak = response.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
  // Never smaller than +-12 dB, so a gentle chain does not look like a violent one.
  const span = Math.max(12, Math.ceil((peak + 1.5) / 3) * 3);
  const dbTicks: number[] = [];
  for (let db = -span; db <= span; db += span / 2) dbTicks.push(db);

  const logMin = Math.log10(MIN_FREQUENCY);
  const logMax = Math.log10(MAX_FREQUENCY);
  const xOf = (hz: number) =>
    PAD_L + ((Math.log10(hz) - logMin) / (logMax - logMin)) * (WIDTH - PAD_L - PAD_R);
  const yOf = (db: number) =>
    PAD_T + ((span - db) / (2 * span)) * (HEIGHT - PAD_T - PAD_B);

  const path = response
    .map((db, i) => `${i === 0 ? "M" : "L"}${xOf(freqs[i]).toFixed(2)} ${yOf(db).toFixed(2)}`)
    .join(" ");

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block w-full"
        role="img"
        aria-label={`Frequency response of ${bands.length} band${bands.length === 1 ? "" : "s"}, peaking at ${peak.toFixed(1)} decibels`}
      >
        {FREQ_TICKS.map((hz) => (
          <g key={hz}>
            <line
              x1={xOf(hz)}
              x2={xOf(hz)}
              y1={PAD_T}
              y2={HEIGHT - PAD_B}
              className="stroke-line"
              strokeWidth={1}
            />
            <text
              x={xOf(hz)}
              y={HEIGHT - 7}
              textAnchor="middle"
              className="fill-muted font-mono"
              fontSize={9}
            >
              {tickLabel(hz)}
            </text>
          </g>
        ))}

        {dbTicks.map((db) => (
          <g key={db}>
            <line
              x1={PAD_L}
              x2={WIDTH - PAD_R}
              y1={yOf(db)}
              y2={yOf(db)}
              className={db === 0 ? "stroke-muted" : "stroke-line"}
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={yOf(db) + 3}
              textAnchor="end"
              className="fill-muted font-mono"
              fontSize={9}
            >
              {db > 0 ? `+${db}` : db}
            </text>
          </g>
        ))}

        <path d={path} fill="none" className="stroke-amber" strokeWidth={2} strokeLinejoin="round" />
      </svg>
      {caption ? <figcaption className="readout mt-2 text-muted">{caption}</figcaption> : null}
    </figure>
  );
}
