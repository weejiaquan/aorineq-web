import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/CodeBlock";
import { DownloadCta } from "@/components/DownloadCta";
import { DOWNLOADS, EAPO_URL, INSTALLER, LATEST_RELEASE_URL, PORTABLE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Install and setup",
  description:
    "Installer or portable build, first run, and exactly when Equalizer APO is required — replacing Windows volume does not need it, driving the APO preamp does.",
};

export default function InstallDocsPage() {
  return (
    <>
      <p className="eyebrow">Getting started</p>
      <h1 className="mt-3 text-4xl font-bold text-text">Install and setup</h1>
      <p className="mt-5 text-lg text-muted">
        AorinEQ comes two ways: an installer that never asks for administrator rights, and a
        single portable exe you just run. Neither needs .NET. What you do after that depends on
        which of the two volume modes you pick on first run.
      </p>

      <div className="my-9">
        <DownloadCta />
      </div>

      <h2 id="which">Installer or portable?</h2>
      <p>
        Take the installer unless you have a reason not to. It is the same application either
        way — same features, same settings folder, same automatic updates — so this is only a
        question of how the file gets onto your disk and how you take it off again.
      </p>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>
              <code>{INSTALLER.assetName}</code>
              <br />
              recommended
            </th>
            <th>
              <code>{PORTABLE.assetName}</code>
              <br />
              portable
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Where it lands</strong>
            </td>
            <td>
              A folder under <code>%LOCALAPPDATA%</code>, for your user account only.
            </td>
            <td>Wherever you put the file.</td>
          </tr>
          <tr>
            <td>
              <strong>Administrator</strong>
            </td>
            <td>Never asked. Installing takes a few seconds and raises no UAC prompt.</td>
            <td>Never asked.</td>
          </tr>
          <tr>
            <td>
              <strong>Start Menu and Apps &amp; Features</strong>
            </td>
            <td>
              A Start Menu shortcut, and a normal entry in Apps &amp; Features with a working
              uninstaller. Reinstalling replaces the entry rather than adding a second one.
            </td>
            <td>Neither. It is one file, so nothing is registered anywhere.</td>
          </tr>
          <tr>
            <td>
              <strong>Updates</strong>
            </td>
            <td>Automatic, in place — the install folder stays writable by you.</td>
            <td>Automatic, in place, as long as its folder is writable.</td>
          </tr>
          <tr>
            <td>
              <strong>Removing it</strong>
            </td>
            <td>Uninstall from Apps &amp; Features. Your skins, presets and settings are kept.</td>
            <td>Delete the file.</td>
          </tr>
        </tbody>
      </table>

      <p>
        The portable build is for people who want a single file and nothing else: carrying it on
        a USB stick, running it on a machine you do not administer, or keeping everything inside
        one folder you control. If none of that describes you, the installer is less work.
      </p>
      <p>
        The installer&apos;s folder is <code>%LOCALAPPDATA%\Programs\AorinEQ</code> — under your
        own profile, which is why it never needs administrator rights and why the app can still
        replace its own exe when it updates.
      </p>
      <p>
        <strong>Both update themselves.</strong> Whichever you take, AorinEQ checks GitHub
        Releases and replaces its own exe in place — the installer does not opt you out of that,
        and the portable build does not miss out on it.
      </p>

      <h2 id="smartscreen">&ldquo;Windows protected your PC&rdquo;</h2>
      <p>
        Expect this, and expect it for <em>both</em> downloads. The first time you run{" "}
        <code>{INSTALLER.assetName}</code> or <code>{PORTABLE.assetName}</code>, Windows
        SmartScreen shows a blue box that says <strong>Windows protected your PC</strong> and
        offers only a <strong>Don&apos;t run</strong> button. Click <strong>More info</strong>,
        then <strong>Run anyway</strong>. It appears once per build.
      </p>
      <p>
        The cause is not a detection of anything. Neither file is code-signed — an Authenticode
        certificate costs more per year than this app charges ever — and SmartScreen warns about
        every unsigned executable it has not seen often enough. Having an installer changes
        nothing here: an unsigned setup exe gets the same blue box as an unsigned app. A
        signature would only prove who published the file, which is what the digests below prove
        instead.
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
          Run <code>{INSTALLER.assetName}</code>; it finishes in a few seconds without asking
          for administrator rights, and AorinEQ is then in the Start Menu. If you took{" "}
          <code>{PORTABLE.assetName}</code> instead, run it from wherever you want it to live —
          the auto-updater replaces the file in place, so pick a folder you can write to.
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
        This is the answer to the SmartScreen warning above. Every release publishes a digest
        beside each file —{" "}
        {DOWNLOADS.map((asset, index) => (
          <span key={asset.assetName}>
            {index > 0 ? " and " : ""}
            <a href={asset.sha256Url}>
              <code>{asset.sha256AssetName}</code>
            </a>
          </span>
        ))}{" "}
        — and the app&apos;s own updater refuses to install a build whose digest does not match.
        Hold a manual download to the same rule. In PowerShell, in the folder you saved it to,
        run the line for the file you actually downloaded:
      </p>
      <CodeBlock label="PowerShell">
        {DOWNLOADS.map((asset) => `Get-FileHash .\\${asset.assetName} -Algorithm SHA256`).join(
          "\n",
        )}
      </CodeBlock>
      <p>
        Compare the 64 characters it prints with the digest shown for that same file on the
        download panel above, with its sidecar, or with the digest on the{" "}
        <a href={LATEST_RELEASE_URL}>release page</a>. All three are the same value. Compare it
        against the <em>other</em> file&apos;s digest and it will not match, because the two are
        different files. If the digest for your file differs, do not run it.
      </p>

      <h2 id="updates">Updates</h2>
      <p>
        Both builds do this. AorinEQ checks GitHub Releases at startup and every 24 hours. An
        update is verified against the release digest, then applied in place: the running exe is
        renamed to <code>{PORTABLE.assetName}.old</code>, the new build takes its path, and the
        app restarts. The installer deliberately puts the app under{" "}
        <code>%LOCALAPPDATA%</code> rather than <code>Program Files</code> so that this keeps
        working without elevation. When running as administrator it finishes on the next start
        instead, to avoid springing a UAC prompt on you. If the folder is not writable, a tray
        balloon links to the release page. Opt out at first run or in Settings.
      </p>

      <h2 id="uninstall">Removing it</h2>
      <p>
        If you used the installer: quit from the tray menu, then uninstall AorinEQ from{" "}
        <strong>Settings → Apps → Installed apps</strong>, as you would any other program. It
        removes the program folder and the Start Menu shortcut and <strong>keeps</strong> your
        skins, presets and settings, so reinstalling later picks up exactly where you left off.
        Delete <code>%APPDATA%\AorinEQ</code> by hand if you want those gone too.
      </p>
      <p>
        If you used the portable build: quit from the tray menu and delete the exe.
      </p>
      <p>
        Either way, normal volume-key handling returns the moment the app exits. The Equalizer
        APO include line and <code>aorineq.txt</code> stay in the APO config folder until you
        remove them, and an <code>aorineq.txt</code> with no app running is a preamp of 0 dB —
        audibly nothing.
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
