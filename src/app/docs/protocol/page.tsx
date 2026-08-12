import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/CodeBlock";
import { AUTOEQ_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "aorineq:// contract",
  description:
    "The four aorineq:// actions, their parameters and validation rules, so any site can emit install and preset links the app accepts.",
};

export default function ProtocolDocsPage() {
  return (
    <>
      <p className="eyebrow">Authoring</p>
      <h1 className="mt-3 text-4xl font-bold text-text">The aorineq:// contract</h1>
      <p className="mt-5 text-lg text-muted">
        AorinEQ registers a URL scheme per user at startup, so a link in a forum post, a Discord
        message or a page like this one can hand someone a skin or a tuning. This is the whole
        contract. A link built to it is a link the app accepts.
      </p>

      <h2 id="rules">Rules that apply to every action</h2>
      <ul>
        <li>
          The action rides in the authority slot: <code>aorineq://&lt;action&gt;?&lt;query&gt;</code>.
          Anything in the path beyond a bare <code>/</code> is not part of the contract.
        </li>
        <li>A whole link is capped at <strong>4000 characters</strong>.</li>
        <li>
          Any <code>url</code> must be absolute <strong>https</strong>, with a real host and no
          credentials. Plain http and <code>file:</code> are refused.
        </li>
        <li>
          Query values are percent-decoded, first key wins, and a stray <code>%</code> sequence
          rejects the link outright.
        </li>
        <li>
          Nothing that changes state happens without a confirmation dialog naming the source. A
          malformed link produces a tray balloon and nothing else.
        </li>
        <li>
          <code>apo-volume://</code> — the scheme used before v3.0.0 — is still registered as an
          alias and resolves identically. Write new links with <code>aorineq://</code>.
        </li>
      </ul>

      <h2 id="install-skin">install-skin</h2>
      <CodeBlock>{`aorineq://install-skin?url=<https URL to the skin zip>&name=<skin name>&sha256=<hex>`}</CodeBlock>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Required</th>
            <th>Rules</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>url</code>
            </td>
            <td>Yes</td>
            <td>
              https link to the zip, percent-encoded inside the link. The download is capped at
              20 MB.
            </td>
          </tr>
          <tr>
            <td>
              <code>name</code>
            </td>
            <td>No</td>
            <td>
              Folder name to install as. Defaults to the zip&apos;s filename stem. Max 100
              characters; no <code>{'" < > | : * ? \\ /'}</code>, no trailing dot, no reserved
              Windows device names, no bidi control characters.
            </td>
          </tr>
          <tr>
            <td>
              <code>sha256</code>
            </td>
            <td>No, but do it</td>
            <td>
              64 hex characters, case-insensitive. The download is rejected if the bytes do not
              match.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Clicking the link opens a confirmation naming the skin and the host, with{" "}
        <strong>Install &amp; Use</strong>, <strong>Install only</strong> and{" "}
        <strong>Cancel</strong>. The{" "}
        <Link href="/tools/skin-link">install-link builder</Link> computes the digest for you.
      </p>

      <h2 id="apply-preset">apply-preset</h2>
      <p>Two shapes. The preset either rides inside the link, or is hosted as a file.</p>
      <CodeBlock label="Inline — nothing hosted anywhere">
        {`aorineq://apply-preset?type=eq&data=<base64url payload>&name=<preset name>&scope=device|global`}
      </CodeBlock>
      <CodeBlock label="Hosted ParametricEQ .txt">
        {`aorineq://apply-preset?type=eq&url=<https URL>&name=<preset name>&scope=device|global&sha256=<hex>`}
      </CodeBlock>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Required</th>
            <th>Rules</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>type</code>
            </td>
            <td>Yes</td>
            <td>
              Currently only <code>eq</code>. Any other value reports &ldquo;needs a newer
              version&rdquo; rather than failing.
            </td>
          </tr>
          <tr>
            <td>
              <code>data</code> / <code>url</code>
            </td>
            <td>Exactly one</td>
            <td>
              Both together is rejected; neither carries no preset. A hosted file must be at most
              1 MB and parse fully as Equalizer APO filter lines.
            </td>
          </tr>
          <tr>
            <td>
              <code>name</code>
            </td>
            <td>No</td>
            <td>
              Preset file name. Defaults to the URL&apos;s filename stem, or &ldquo;Shared
              preset&rdquo; for an inline link. Same naming rules as above.
            </td>
          </tr>
          <tr>
            <td>
              <code>scope</code>
            </td>
            <td>No</td>
            <td>
              <code>device</code> (default) or <code>global</code>. With no active playback
              device a <code>device</code> link lands on the global chain and the dialog says so.
            </td>
          </tr>
          <tr>
            <td>
              <code>sha256</code>
            </td>
            <td>Hosted only</td>
            <td>
              Refused on <code>data</code> links, which carry no separate file to verify.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The confirmation shows the source, the target scope, the band count, the preamp and the
        response curve itself. A hosted file is only fetched when the user presses Preview or
        accepts — a link on its own never makes the app touch the network.
      </p>

      <h3 id="payload">The data payload</h3>
      <p>UTF-8 text, base64url-encoded with <code>-</code>/<code>_</code> and padding stripped:</p>
      <CodeBlock>{`v1|<preamp dB>|<TYPE>,<Fc Hz>,<gain dB>,<Q>;<TYPE>,<Fc Hz>,<gain dB>,<Q>;…`}</CodeBlock>
      <p>
        <code>TYPE</code> is an Equalizer APO filter token: <code>PK</code>, <code>LSC</code>,{" "}
        <code>HSC</code>, <code>NO</code>, <code>LPQ</code>, <code>HPQ</code>. Numbers use{" "}
        <code>.</code> as the decimal separator. Gain is written for every band and ignored for
        the types that have none. Up to 64 bands.
      </p>
      <CodeBlock label="Example">
        {`v1|-6.1|LSC,105,-1.4,0.7;PK,3200,2.6,1.8

  encodes to

djF8LTYuMXxMU0MsMTA1LC0xLjQsMC43O1BLLDMyMDAsMi42LDEuOA`}
      </CodeBlock>
      <p>
        Anything that does not decode cleanly — wrong alphabet, invalid UTF-8, an unknown
        version, a bad number, too many bands — is a malformed link. Values that parse but sit
        out of range are clamped to the editor&apos;s own limits: Fc 10–24000 Hz, gain ±30 dB, Q
        0.1–50, preamp −60 to +20 dB. The{" "}
        <Link href="/tools/eq-preset">preset builder</Link> encodes and decodes this format in
        the browser.
      </p>

      <h2 id="autoeq">autoeq</h2>
      <CodeBlock>{`aorineq://autoeq?model=<headphone model>`}</CodeBlock>
      <p>
        Opens the <a href={AUTOEQ_URL}>AutoEq</a> import window with the search box pre-filled.
        It only fills in the search — the user still picks a profile and presses Import.{" "}
        <code>model</code> is required, at most 120 characters, and may not contain control
        characters.
      </p>

      <h2 id="open">open</h2>
      <CodeBlock>{`aorineq://open?page=eq|settings|designer|skins`}</CodeBlock>
      <p>
        Brings up that window. Opening a window changes nothing, so these links ask nothing. An
        unknown page reports &ldquo;needs a newer version&rdquo;.
      </p>

      <h2 id="not-implemented">Deliberately absent</h2>
      <p>
        There is no <code>set-volume</code> and no <code>mute</code>. Any page could use them to
        nuisance-toggle someone&apos;s audio, and putting a confirmation dialog on them would
        make them pointless.
      </p>

      <h2 id="examples">Examples</h2>
      <CodeBlock label="HTML">
        {`<a href="aorineq://install-skin?url=https%3A%2F%2Fexample.com%2Fskins%2Fneon-bar.zip&name=neon-bar&sha256=…">
  Install the neon-bar skin
</a>

<a href="aorineq://apply-preset?type=eq&url=https%3A%2F%2Fexample.com%2Fpresets%2FHD650.txt&name=HD650&sha256=…">
  Apply the HD 650 correction
</a>

<a href="aorineq://autoeq?model=Sennheiser%20HD%20650">Find it on AutoEq</a>`}
      </CodeBlock>
      <p>
        A browser will ask before handing the link to AorinEQ, and AorinEQ asks again before it
        does anything. If a reader has the app but the link does nothing, the most likely causes
        are a non-https URL, a name that breaks the rules above, or the scheme being switched off
        in Settings.
      </p>

      <h2 id="hosting">Where to host the file</h2>
      <p>
        Anywhere that serves it over https with a stable URL: a GitHub release asset, an object
        store, your own site. <strong>Discord attachment links no longer work for this.</strong>{" "}
        Discord now signs CDN URLs with an expiry, so a link that works today returns an error in
        a day or two and every install button pointing at it breaks. Post the file to Discord if
        you like, but host the copy your link points at somewhere permanent.
      </p>
    </>
  );
}
