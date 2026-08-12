import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/CodeBlock";
import { DownloadCta } from "@/components/DownloadCta";
import {
  EAPO_URL,
  EXE_ASSET_NAME,
  LATEST_RELEASE_URL,
  SHA256_ASSET_NAME,
  SHA256_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Install and setup",
  description:
    "Download, first run, and exactly when Equalizer APO is required — replacing Windows volume does not need it, driving the APO preamp does.",
};

export default function InstallDocsPage() {
  return (
    <>
      <p className="eyebrow">Getting started</p>
      <h1 className="mt-3 text-4xl font-bold text-text">Install and setup</h1>
      <p className="mt-5 text-lg text-muted">
        AorinEQ is one self-contained exe. There is no installer and no .NET prerequisite. What
        you do next depends on which of the two volume modes you pick on first run.
      </p>

      <div className="my-9">
        <DownloadCta />
      </div>

      <h2 id="smartscreen">&ldquo;Windows protected your PC&rdquo;</h2>
      <p>
        Expect this. The first time you run <code>{EXE_ASSET_NAME}</code>, Windows SmartScreen
        shows a blue box that says <strong>Windows protected your PC</strong> and offers only a
        <strong> Don&apos;t run</strong> button. Click <strong>More info</strong>, then{" "}
        <strong>Run anyway</strong>. It appears once per build.
      </p>
      <p>
        The cause is not a detection of anything. AorinEQ is not code-signed — an
        Authenticode certificate costs more per year than this app charges ever — and SmartScreen
        warns about every unsigned executable it has not seen often enough. A signature would
        only prove who published the file, which is what the digest below proves instead.
      </p>
      <p>
        If your browser blocks the download itself rather than the run, it is the same reasoning:
        choose <strong>Keep</strong> when it asks.
      </p>

      <h2 id="two-modes">The two volume modes</h2>
      <p>
        First run asks one question, and it decides whether you need Equalizer APO at all.
      </p>

      <table>
        <thead>
          <tr>
            <th>Mode</th>
            <th>What the volume keys do</th>
            <th>Equalizer APO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Replace Windows volume</strong>
            </td>
            <td>
              Move the normal Windows volume, and show your skinned OSD instead of the Windows
              one. Any Equalizer APO EQ you already have is left untouched.
            </td>
            <td>
              <strong>Not needed.</strong>
            </td>
          </tr>
          <tr>
            <td>
              <strong>Equalizer APO preamp slider</strong>
            </td>
            <td>
              Write Equalizer APO&apos;s preamp; Windows volume stays parked. Attenuation
              happens inside the APO chain, before your EQ and before the audio reaches the DAC.
            </td>
            <td>
              <strong>Required.</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Pick the second one if your DAC ignores Windows volume — the slider moves and nothing
        changes — or if you specifically want level control ahead of the DAC. Pick the first if
        Windows volume works fine and you are here for the skinnable display.
      </p>
      <p>
        The <strong>equalizer</strong> is a separate matter: it writes real Equalizer APO
        filters, so using it needs Equalizer APO regardless of which volume mode you chose.
      </p>

      <h2 id="first-run">First run</h2>
      <ol>
        <li>
          Run <code>AorinEQ.exe</code>. Keep it wherever you want it to live — the auto-updater
          replaces the file in place, so a folder you can write to is a good idea.
        </li>
        <li>Choose a volume mode, and whether to keep the app updated automatically.</li>
        <li>
          In APO preamp mode, AorinEQ creates <code>aorineq.txt</code> in the Equalizer APO
          config folder and adds an <code>Include:</code> line to <code>config.txt</code>,
          elevating once only if it has to.
        </li>
        <li>
          Set your DAC&apos;s physical volume knob to your maximum comfortable loudness, once.
          From then on the keyboard controls loudness digitally below that ceiling.
        </li>
        <li>
          Tray menu → Settings… → <strong>Start with Windows</strong> to run at boot.
        </li>
      </ol>

      <h2 id="equalizer-apo">Installing Equalizer APO</h2>
      <p>
        AorinEQ never bundles it. If it is missing, the app opens a setup guide that downloads
        the official installer from{" "}
        <a href={EAPO_URL}>equalizerapo.com</a>, starts it, and tells you the one step that
        needs you: ticking your speakers or headphones in Equalizer APO&apos;s Configurator.
        Afterwards it verifies the install against your current playback device and offers a
        one-click audio restart instead of a reboot.
      </p>
      <p>
        The guide reopens any time from Settings → <strong>Setup guide…</strong>, which also
        shows a live status line and an <strong>Open Configurator</strong> shortcut for enabling
        other devices. Equalizer APO is free and open source under GPLv2, and is a separate
        project from this one.
      </p>

      <h2 id="games">Volume keys in games</h2>
      <p>
        Windows does not deliver keystrokes to normal apps while an elevated window has focus,
        which covers many games and anticheats — so the volume keys look dead in-game. The fix
        is Settings → <strong>Run as administrator</strong>. AorinEQ relaunches elevated behind
        one UAC prompt, and <strong>Start with Windows</strong> switches from the registry Run
        key to a scheduled task so elevated autostart stays silent at boot.
      </p>
      <p>
        Known limitation: on laptops, Windows&apos; scheduled-task defaults stop that task from
        starting on battery power. Desktops are unaffected. Until it is fixed, plug in before
        rebooting or start the app by hand.
      </p>

      <h2 id="verify">Verifying the download</h2>
      <p>
        This is the answer to the SmartScreen warning above. Every release ships{" "}
        <a href={SHA256_URL}>
          <code>{SHA256_ASSET_NAME}</code>
        </a>{" "}
        beside the exe, and the app&apos;s own updater refuses to install a build whose digest
        does not match it. Hold a manual download to the same rule — in PowerShell, in the folder
        you saved it to:
      </p>
      <CodeBlock label="PowerShell">
        {`Get-FileHash .\\${EXE_ASSET_NAME} -Algorithm SHA256`}
      </CodeBlock>
      <p>
        Compare the 64 characters it prints with the digest shown on the download button above,
        with the sidecar file, or with the digest on the{" "}
        <a href={LATEST_RELEASE_URL}>release page</a>. All three are the same value. If they
        differ, do not run the file.
      </p>

      <h2 id="updates">Updates</h2>
      <p>
        AorinEQ checks GitHub Releases at startup and every 24 hours. An update is verified
        against the release digest, then applied in place: the running exe is renamed to{" "}
        <code>AorinEQ.exe.old</code>, the new build takes its path, and the app restarts. When
        running as administrator it finishes on the next start instead, to avoid springing a UAC
        prompt on you. If the folder is not writable, a tray balloon links to the release page.
        Opt out at first run or in Settings.
      </p>

      <h2 id="uninstall">Removing it</h2>
      <p>
        Quit from the tray menu and delete the exe. Normal volume-key handling returns the
        moment the app exits. Skins, presets and settings live in{" "}
        <code>%APPDATA%\AorinEQ</code>; the Equalizer APO include line and{" "}
        <code>aorineq.txt</code> stay in the APO config folder until you remove them, and an
        <code> aorineq.txt</code> with no app running is a preamp of 0 dB — audibly nothing.
      </p>

      <h2 id="next">Next</h2>
      <p>
        <Link href="/docs/skins">Build a skin</Link>, or read the{" "}
        <Link href="/docs/protocol">aorineq:// contract</Link> if you want install buttons on
        your own site.
      </p>
    </>
  );
}
