import type { Metadata } from "next";
import Link from "next/link";

import { ContactCallout } from "@/components/ContactCallout";
import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "What this site is, what it does with what you paste into it, and the limits of what it promises.",
};

export default function TermsPage() {
  return (
    <>
      <p className="eyebrow">Policies</p>
      <h1 className="mt-3 text-4xl font-bold text-text">Terms</h1>
      <p className="mt-5 text-lg text-muted">
        This is a small site for a free program. These terms are short because there is not much
        happening: no accounts, no payments, and nothing of yours is stored here.
      </p>

      <h2 id="what-this-is">What this is</h2>
      <p>
        This site documents AorinEQ, links to its releases on GitHub, hosts a small gallery of
        skins, and provides two link builders. AorinEQ itself is MIT-licensed; the{" "}
        <a href={GITHUB_URL}>source is public</a> and the licence in that repository governs the
        program.
      </p>
      <p>
        Equalizer APO is a separate project under GPLv2. It is not distributed here and is not
        affiliated with this one. AutoEq is likewise a separate project.
      </p>

      <h2 id="what-happens-to-input">What happens to what you type in</h2>
      <ul>
        <li>
          <strong>The EQ preset builder</strong> runs entirely in your browser. The preset is
          encoded into the link itself. Nothing is sent to this server, and nothing is stored.
        </li>
        <li>
          <strong>The install-link builder</strong> sends the URL you paste to this site&apos;s
          server, which fetches that file, hashes it while streaming, and discards it. The file
          is never written to disk here and the URL is not retained after the response.
        </li>
        <li>
          There are no accounts, no cookies set by this site, and no analytics. The host may keep
          ordinary request logs.
        </li>
      </ul>

      <h2 id="use">Using the site</h2>
      <p>
        Do not use the link builder to make this server fetch things it has no business fetching
        — internal addresses, other people&apos;s private endpoints, or files that exist to
        overwhelm it. Those requests are refused, and repeatedly trying is abuse.
      </p>
      <p>
        Do not submit content you have no right to distribute. What is and is not welcome in the
        gallery is spelled out in the{" "}
        <Link href="/legal/content-policy">content policy</Link>.
      </p>

      <h2 id="links">Links off this site</h2>
      <p>
        An <code>aorineq://install-skin</code> link built here points at a file on someone
        else&apos;s host. This site does not check what is in it, cannot vouch for it, and has no
        control over it once the link exists. The digest pin means the file cannot change without
        the link breaking, which is a guarantee about <em>consistency</em>, not about
        trustworthiness. Install skins from people you have reason to trust.
      </p>
      <p>
        Files served from <strong>this</strong> site&apos;s gallery are a different matter:
        those were reviewed before being committed, and the digest shown on each card is
        computed from the exact bytes served.
      </p>

      <h2 id="warranty">No warranty</h2>
      <p>
        The site and the program are provided as they are, without warranty of any kind. AorinEQ
        changes your audio configuration and intercepts your volume keys; that is what it is for,
        and it is your call whether to run it. To the extent the law allows, the author is not
        liable for damage arising from using the site or the program.
      </p>

      <h2 id="changes">Changes</h2>
      <p>
        These terms can change. The site is version-controlled, so the history of every change is
        public in its repository. Continuing to use the site after a change means the current
        version applies.
      </p>

      <h2 id="contact">Contact</h2>
      <p>For anything on this page, or anything about the gallery:</p>
      <ContactCallout />
    </>
  );
}
