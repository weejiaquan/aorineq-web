"use client";

import { useState } from "react";

import { CopyField } from "./CopyField";
import {
  buildInstallSkinLink,
  nameFromUrl,
  validateDownloadUrl,
  validateName,
} from "@/lib/protocol";
import { formatBytes } from "@/lib/site";

/**
 * Turns a hosted skin zip into an `aorineq://install-skin` link.
 *
 * The URL and the name are validated here with the same rules the desktop app applies, so a
 * link this form produces cannot be one the app silently ignores. The digest comes from the
 * server, which fetches the file and hashes it — nothing about it is taken on trust from the
 * person filling in the form.
 */

interface Digest {
  sha256: string;
  bytes: number;
  contentType: string | null;
  finalUrl: string;
}

export function SkinLinkBuilder() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [digest, setDigest] = useState<Digest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unpinned, setUnpinned] = useState(false);

  const urlCheck = validateDownloadUrl(url);
  const effectiveName = name.trim() || nameFromUrl(urlCheck.url ?? "");
  const nameError = effectiveName ? validateName(effectiveName, "Skin name") : null;
  const canSubmit = urlCheck.ok && !nameError && !busy;

  const reset = () => {
    setDigest(null);
    setUnpinned(false);
    setError(null);
  };

  const check = async () => {
    if (!canSubmit || !urlCheck.url) return;
    setBusy(true);
    reset();
    try {
      const response = await fetch("/api/skin-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlCheck.url }),
      });
      const json = (await response.json()) as
        | { ok: true; sha256: string; bytes: number; contentType: string | null; finalUrl: string }
        | { ok: false; error: string };
      if (json.ok) {
        setDigest({
          sha256: json.sha256,
          bytes: json.bytes,
          contentType: json.contentType,
          finalUrl: json.finalUrl,
        });
      } else {
        setError(json.error);
      }
    } catch {
      setError("The check could not be run. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const link =
    urlCheck.ok && urlCheck.url && (digest || unpinned) && !nameError
      ? buildInstallSkinLink({
          url: urlCheck.url,
          name: effectiveName || undefined,
          sha256: digest?.sha256,
        })
      : null;

  const redirected = digest && digest.finalUrl !== urlCheck.url;

  return (
    <div>
      <div className="panel p-6">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Field
            label="https link to the skin zip"
            hint="Where the file actually lives. GitHub release assets, an object store, your own host."
            error={url.length > 0 && !urlCheck.ok ? urlCheck.error : undefined}
          >
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                reset();
              }}
              placeholder="https://example.com/skins/neon-bar.zip"
              className="w-full rounded-sm border border-line bg-ink px-3 py-2.5 font-mono text-sm text-text placeholder:text-muted/60"
            />
          </Field>

          <Field
            label="Install as"
            hint={
              name.trim().length === 0 && effectiveName
                ? `Defaults to "${effectiveName}" from the file name.`
                : "The folder name AorinEQ creates."
            }
            error={nameError ?? undefined}
          >
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={nameFromUrl(urlCheck.url ?? "") || "neon-bar"}
              className="w-full rounded-sm border border-line bg-ink px-3 py-2.5 font-mono text-sm text-text placeholder:text-muted/60"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={check}
            disabled={!canSubmit}
            className="rounded-sm bg-amber px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Fetching and hashing…" : "Check the file and build the link"}
          </button>
          {error ? (
            <button
              type="button"
              onClick={() => {
                setUnpinned(true);
                setError(null);
              }}
              className="rounded-sm border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-amber hover:text-amber"
            >
              Build it without a digest
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-rust" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {digest ? (
        <div className="panel mt-6 p-6">
          <p className="eyebrow">The file, as the app will see it</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat label="SHA-256" value={digest.sha256} tone="mint" wrap />
            <Stat label="Size" value={formatBytes(digest.bytes)} />
            <Stat label="Content type" value={digest.contentType ?? "not declared"} />
          </dl>
          {redirected ? (
            <p className="mt-4 text-sm text-muted">
              That URL redirected to <span className="readout text-text">{digest.finalUrl}</span>.
              The link below still points at what you entered, which is correct as long as the
              redirect is permanent — if it is not, use the final URL instead.
            </p>
          ) : null}
        </div>
      ) : null}

      {unpinned && !digest ? (
        <p className="mt-6 rounded-sm border border-rust/40 bg-panel p-4 text-sm text-muted">
          <strong className="text-rust">No digest.</strong> The link below will install whatever
          is at that URL at the moment someone clicks it. Fine for a file only you can replace;
          not fine for anything you do not control.
        </p>
      ) : null}

      {link ? (
        <div className="mt-6 space-y-4">
          <CopyField label="Install link" value={link} />
          <CopyField
            label="Markdown, for Discord and forums"
            value={`[Install ${effectiveName} in AorinEQ](${link})`}
            tone="text"
          />
          <CopyField
            label="HTML, for your own site"
            value={`<a href="${link}">Install ${effectiveName} in AorinEQ</a>`}
            tone="text"
          />
          <div className="panel p-4">
            <p className="eyebrow">Try it</p>
            <a
              href={link}
              className="mt-2 inline-block rounded-sm bg-amber px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              Install {effectiveName} in AorinEQ
            </a>
            <p className="mt-3 text-sm text-muted">
              With AorinEQ installed this opens its confirmation dialog. Without it, the browser
              will say it does not know the scheme — which is also what a reader without the app
              sees.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <span className="mt-2 block">{children}</span>
      <span className={`mt-2 block text-sm ${error ? "text-rust" : "text-muted"}`}>
        {error ?? hint}
      </span>
    </label>
  );
}

function Stat({
  label,
  value,
  tone,
  wrap,
}: {
  label: string;
  value: string;
  tone?: "mint";
  wrap?: boolean;
}) {
  return (
    <div className={wrap ? "sm:col-span-3" : ""}>
      <dt className="eyebrow">{label}</dt>
      <dd className={`readout mt-1 ${tone === "mint" ? "text-mint" : "text-text"}`}>{value}</dd>
    </div>
  );
}
