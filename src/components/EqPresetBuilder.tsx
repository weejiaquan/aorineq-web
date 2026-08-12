"use client";

import { useMemo, useState } from "react";

import { CopyField } from "./CopyField";
import { EqCurve } from "./EqCurve";
import {
  MAX_BANDS,
  MAX_GAIN_DB,
  MAX_FC,
  MAX_Q,
  MIN_FC,
  MIN_Q,
  clampBand,
  clampPreamp,
  newBand,
  parsePreset,
  serializePreset,
  type EqBand,
  type EqBandType,
} from "@/lib/eq";
import { suggestPreampDb } from "@/lib/eq-response";
import { decodePreset, encodePreset } from "@/lib/eq-share";
import {
  MAX_LINK_LENGTH,
  buildApplyPresetInlineLink,
  fitsLinkLimit,
  validateName,
  type EqScope,
} from "@/lib/protocol";

/**
 * Builds and reads `aorineq://apply-preset` links.
 *
 * Nothing is stored anywhere: the whole band chain is encoded into the link, so a tuning is
 * shared the way a sentence is. Encoding, decoding and the response curve all run the same
 * code the desktop app runs, which is why the curve here matches the one in the confirmation
 * dialog the recipient sees.
 */

const TYPES: { value: EqBandType; label: string }[] = [
  { value: "Peak", label: "PK · peak" },
  { value: "LowShelf", label: "LSC · low shelf" },
  { value: "HighShelf", label: "HSC · high shelf" },
  { value: "Notch", label: "NO · notch" },
  { value: "LowPass", label: "LPQ · low pass" },
  { value: "HighPass", label: "HPQ · high pass" },
];

const STARTING_BANDS: EqBand[] = [
  { type: "LowShelf", fc: 105, gainDb: 3.5, q: 0.7 },
  { type: "Peak", fc: 3200, gainDb: -4.2, q: 2.4 },
  { type: "HighShelf", fc: 9000, gainDb: 2, q: 0.7 },
];

export function EqPresetBuilder() {
  const [bands, setBands] = useState<EqBand[]>(STARTING_BANDS);
  const [preampDb, setPreampDb] = useState(0);
  const [name, setName] = useState("My tuning");
  const [scope, setScope] = useState<EqScope>("device");
  const [importText, setImportText] = useState("");
  const [importNote, setImportNote] = useState<string | null>(null);

  const nameError = validateName(name, "Preset name");
  const suggested = useMemo(() => suggestPreampDb(bands), [bands]);
  const preset = useMemo(() => ({ name, preampDb, bands }), [name, preampDb, bands]);
  const payload = useMemo(() => encodePreset(preset), [preset]);
  const link = buildApplyPresetInlineLink({
    data: payload,
    name: nameError ? undefined : name,
    scope,
  });
  const tooLong = !fitsLinkLimit(link);

  const update = (index: number, patch: Partial<EqBand>) => {
    setBands((current) =>
      current.map((band, i) => (i === index ? clampBand({ ...band, ...patch }) : band)),
    );
  };

  const runImport = () => {
    const text = importText.trim();
    if (text.length === 0) {
      setImportNote("Paste a link, a data payload, or Equalizer APO filter lines first.");
      return;
    }

    // A whole share link, or the bare payload out of one.
    const dataMatch = text.match(/[?&]data=([A-Za-z0-9_-]+)/) ?? text.match(/^[A-Za-z0-9_-]+$/);
    if (dataMatch) {
      const result = decodePreset(dataMatch[1] ?? dataMatch[0], name);
      if (result.ok) {
        setBands(result.preset.bands);
        setPreampDb(result.preset.preampDb);
        const nameInLink = text.match(/[?&]name=([^&\s]+)/);
        if (nameInLink) setName(decodeURIComponent(nameInLink[1]));
        const scopeInLink = text.match(/[?&]scope=(device|global)/);
        if (scopeInLink) setScope(scopeInLink[1] as EqScope);
        setImportNote(
          `Loaded ${result.preset.bands.length} band${result.preset.bands.length === 1 ? "" : "s"} from the link.`,
        );
        return;
      }
      setImportNote(result.error);
      return;
    }

    const parsed = parsePreset(name, text);
    if (parsed.bands.length === 0) {
      setImportNote("No usable filter lines in that text.");
      return;
    }
    setBands(parsed.bands);
    setPreampDb(parsed.preampDb);
    setImportNote(
      `Loaded ${parsed.bands.length} band${parsed.bands.length === 1 ? "" : "s"} from ParametricEQ text.`,
    );
  };

  return (
    <div className="grid gap-10 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
      <div>
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="eyebrow">
              Bands · {bands.length} of {MAX_BANDS}
            </p>
            <button
              type="button"
              onClick={() => setBands((c) => (c.length < MAX_BANDS ? [...c, newBand()] : c))}
              disabled={bands.length >= MAX_BANDS}
              className="rounded-sm border border-line px-2.5 py-1 text-sm text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-40"
            >
              Add band
            </button>
          </div>

          <div className="divide-y divide-line">
            {bands.map((band, index) => (
              <div key={index} className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-11 sm:items-end">
                <label className="col-span-2 sm:col-span-3">
                  <span className="eyebrow">Type</span>
                  <select
                    value={band.type}
                    onChange={(e) => update(index, { type: e.target.value as EqBandType })}
                    className="mt-1.5 w-full rounded-sm border border-line bg-ink px-2 py-2 font-mono text-sm text-text"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <NumberField
                  label="Fc Hz"
                  value={band.fc}
                  min={MIN_FC}
                  max={MAX_FC}
                  step={1}
                  onChange={(fc) => update(index, { fc })}
                  className="sm:col-span-2"
                />
                <NumberField
                  label="Gain dB"
                  value={band.gainDb}
                  min={-MAX_GAIN_DB}
                  max={MAX_GAIN_DB}
                  step={0.1}
                  onChange={(gainDb) => update(index, { gainDb })}
                  className="sm:col-span-2"
                />
                <NumberField
                  label="Q"
                  value={band.q}
                  min={MIN_Q}
                  max={MAX_Q}
                  step={0.01}
                  onChange={(q) => update(index, { q })}
                  className="sm:col-span-2"
                />
                <button
                  type="button"
                  onClick={() => setBands((c) => c.filter((_, i) => i !== index))}
                  className="h-[38px] rounded-sm border border-line text-sm text-muted transition-colors hover:border-rust hover:text-rust sm:col-span-2"
                  aria-label={`Remove band ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
            {bands.length === 0 ? (
              <p className="p-5 text-sm text-muted">
                No bands yet. Add one, or paste a preset below.
              </p>
            ) : null}
          </div>
        </div>

        <div className="panel mt-6 p-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="sm:col-span-1">
              <span className="eyebrow">Preamp dB</span>
              <input
                type="number"
                step={0.1}
                value={preampDb}
                onChange={(e) => setPreampDb(clampPreamp(Number(e.target.value)))}
                className="mt-1.5 w-full rounded-sm border border-line bg-ink px-2 py-2 font-mono text-sm text-text"
              />
            </label>
            <div className="sm:col-span-2">
              <span className="eyebrow">Clipping headroom</span>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreampDb(suggested)}
                  className="rounded-sm border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
                >
                  Use {suggested.toFixed(1)} dB
                </button>
                <p className="text-sm text-muted">
                  The negation of the chain&apos;s own peak, so the boost cannot clip.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="panel mt-6 p-5">
          <label className="block">
            <span className="eyebrow">Load an existing preset</span>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={5}
              placeholder={`A share link, or Equalizer APO text:

Preamp: -6.1 dB
Filter 1: ON PK Fc 3200 Hz Gain 2.6 dB Q 1.80`}
              className="mt-2 w-full rounded-sm border border-line bg-ink px-3 py-2.5 font-mono text-xs text-text placeholder:text-muted/60"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runImport}
              className="rounded-sm border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
            >
              Load it
            </button>
            {importNote ? <p className="text-sm text-mint">{importNote}</p> : null}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="panel p-5">
          <p className="eyebrow">Response · summed</p>
          <EqCurve
            className="mt-4"
            bands={bands}
            caption={`${bands.length} band${bands.length === 1 ? "" : "s"} · preamp ${preampDb.toFixed(1)} dB`}
          />
        </div>

        <div className="panel mt-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="eyebrow">Preset name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-line bg-ink px-2 py-2 font-mono text-sm text-text"
              />
              <span className={`mt-1.5 block text-sm ${nameError ? "text-rust" : "text-muted"}`}>
                {nameError ?? "Saved under this name on the other machine."}
              </span>
            </label>
            <label>
              <span className="eyebrow">Lands on</span>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as EqScope)}
                className="mt-1.5 w-full rounded-sm border border-line bg-ink px-2 py-2 font-mono text-sm text-text"
              >
                <option value="device">device · the output they are using</option>
                <option value="global">global · every device</option>
              </select>
              <span className="mt-1.5 block text-sm text-muted">
                Device chains stack on top of the global one.
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {tooLong ? (
            <p className="rounded-sm border border-rust/40 bg-panel p-4 text-sm text-muted">
              <strong className="text-rust">Too long to share as a link.</strong> This chain
              encodes to {link.length} characters and the limit is {MAX_LINK_LENGTH}. Host the
              preset as a ParametricEQ .txt and use a <code className="font-mono">url=</code>{" "}
              link instead.
            </p>
          ) : (
            <CopyField label={`Share link · ${link.length} characters`} value={link} />
          )}

          <CopyField
            label="Markdown"
            value={`[Apply “${name}” in AorinEQ](${link})`}
            tone="text"
          />

          <div className="panel overflow-hidden">
            <p className="eyebrow border-b border-line px-4 py-2">Equalizer APO ParametricEQ</p>
            <pre className="overflow-x-auto px-4 py-3">
              <code className="font-mono text-[0.8125rem] leading-relaxed text-text">
                {serializePreset(preset) || "No bands yet."}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="eyebrow">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        className="mt-1.5 w-full rounded-sm border border-line bg-ink px-2 py-2 font-mono text-sm text-text"
      />
    </label>
  );
}
