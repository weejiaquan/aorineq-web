# aorineq-web

The website for [AorinEQ](https://github.com/weejiaquan/aorineq) — a Windows tray app for
volume keys, a skinnable on-screen display, and a per-device parametric EQ written into
Equalizer APO.

Next.js (App Router) + Tailwind, deployed on Vercel. No database, no uploads, no accounts.

## What is here

| Route | What it does |
| --- | --- |
| `/` | Landing page. Live skin preview driven by the app's real fill math, and a one-click download of the installer with its SHA-256. |
| `/docs/install` | Installer vs portable, setup, and when Equalizer APO is and is not required. |
| `/docs/skins` | Every `skin.json` field, the fill range, sprite sheets, GIF and muted layers. |
| `/docs/protocol` | The `aorineq://` URL contract, so other sites can emit install buttons. |
| `/gallery` | Manifest-driven skin gallery. Each card previews the real artwork and carries an install link with the digest pinned. |
| `/tools/skin-link` | Paste an https link to a skin zip; the server hashes it and returns an `aorineq://install-skin` link. |
| `/tools/eq-preset` | Build a band chain, see its response curve, and get an `aorineq://apply-preset` link that carries the whole preset. |
| `/legal/*` | Terms, content policy, and the takedown route. |

## The download links depend on the asset filenames

Two builds are offered. The installer is primary everywhere — hero, docs, sticky header, footer
— and the portable exe is the labelled secondary. Every control is a direct link, so a visitor
gets the file on the first click instead of landing on a release page:

```
https://github.com/weejiaquan/aorineq/releases/latest/download/AorinEQ-Setup.exe
https://github.com/weejiaquan/aorineq/releases/latest/download/AorinEQ-Setup.exe.sha256
https://github.com/weejiaquan/aorineq/releases/latest/download/AorinEQ.exe
https://github.com/weejiaquan/aorineq/releases/latest/download/AorinEQ.exe.sha256
```

GitHub resolves `latest/download/<name>` by **asset filename**, not by tag. That is what keeps
the links correct forever without a rebuild here — and it is also the one thing that can break
them silently:

> **A release must publish its assets as exactly `AorinEQ-Setup.exe` and `AorinEQ.exe`, each
> with a `.sha256` sidecar of the same name.** Rename any of them — `AorinEQ-v1.5.exe`,
> `AorinEQ.zip`, a suffixed architecture — and these links 404. Nothing on this site can detect
> that; the page still renders, the button still looks right, and every download fails.

The names live in `src/lib/site.ts` as the `INSTALLER` and `PORTABLE` assets, built by
`releaseAsset()` — which derives each file's sidecar name and both URLs from the one filename,
so a digest can never be shown under the wrong file. `latestAssetUrl()` is the only place a
download URL is built, and `src/test/download.test.ts` fails if any page or component writes a
GitHub URL of its own.

The version, sizes and digests shown beside the buttons come from the GitHub API and each
file's own `.sha256` sidecar, cached for an hour. If any of that is unavailable the buttons
still work — they never depend on a successful API call.

## The parts ported from the desktop app

These mirror files in the AorinEQ repository and must not drift from them. Each carries a
comment naming its source.

| Here | There |
| --- | --- |
| `src/lib/skin-math.ts` | `SkinMath.cs`, plus `SkinComposite.ComplementClip` |
| `src/lib/skin.ts` | `SkinLoader.cs` |
| `src/lib/volume.ts` | `VolumeState.cs` |
| `src/lib/eq.ts` | `Eq.cs` |
| `src/lib/eq-response.ts` | `EqResponse.cs` |
| `src/lib/eq-share.ts` | `EqShare.cs` |
| `src/lib/protocol.ts` | `ProtocolLink.cs`, `FileNames.cs` |
| `src/lib/png.ts` | `PngHeader.cs` |

## Adding a skin to the gallery

1. Put `empty.png`, `full.png` and `skin.json` in `public/skins/<id>/`.
2. Zip those files at the archive root as `public/skins/<id>.zip`.
3. Add an entry to `src/data/skins.json`.
4. `npm test` — the suite reads the real files and fails if the manifest and the artwork
   disagree.

Dimensions and the SHA-256 are read from the files at build time. Nothing about a skin is
typed twice.

## Commands

```
npm run dev        # local development
npm run build      # production build
npm test           # vitest, including the contrast check against globals.css
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Configuration

`NEXT_PUBLIC_SITE_URL` sets the absolute origin baked into `aorineq://install-skin` links. On
Vercel it falls back to `VERCEL_PROJECT_PRODUCTION_URL`. Locally there is no https origin, so
links built in development point at `http://localhost:3000` and the app will refuse them —
that is correct, not a bug.

`CONTACT_EMAIL` in `src/lib/site.ts` is a placeholder. The policy pages say so, loudly, until
it is replaced.

## Colour and contrast

The palette lives in `src/app/globals.css` and is sourced from the seed skin's own artwork
(`#FEC707` percent text, `#F3CFAB` outline). Every foreground/background pairing the UI uses
is listed in `src/lib/contrast.ts` and checked against the stylesheet by
`src/test/contrast.test.ts`. A palette edit that drops a pairing below its threshold fails the
test run.
