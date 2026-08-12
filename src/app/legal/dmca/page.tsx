import type { Metadata } from "next";
import Link from "next/link";

import { ContactCallout } from "@/components/ContactCallout";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Report or take down",
  description:
    "How to report a skin in the gallery, including the details a copyright notice needs and what happens after you send one.",
};

export default function DmcaPage() {
  return (
    <>
      <p className="eyebrow">Policies</p>
      <h1 className="mt-3 text-4xl font-bold text-text">Report or take down</h1>
      <p className="mt-5 text-lg text-muted">
        If something in the gallery uses your work without permission, or breaks the{" "}
        <Link href="/legal/content-policy">content policy</Link>, this page is how you get it
        removed. You do not need a lawyer and you do not need a form letter.
      </p>

      <ContactCallout />

      <h2 id="quickest">The quickest version</h2>
      <p>
        Send a message naming the listing — its title or the link to its card — and saying what
        is wrong with it. If it is a copyright matter, say what work of yours it uses and confirm
        you are the rights holder or authorised to act for them. That is enough to act on.
      </p>

      <h2 id="copyright">A copyright notice</h2>
      <p>
        For a formal notice under the DMCA, include all of the following. Anything missing slows
        it down rather than stopping it.
      </p>
      <ol>
        <li>Your name and a physical or email address where you can be reached.</li>
        <li>
          Identification of the work you say is infringed — a link to the original, or a
          description precise enough to recognise it.
        </li>
        <li>
          Identification of the listing you want removed, precise enough to find it: the skin
          title, its card link, or the file URL.
        </li>
        <li>
          A statement that you believe in good faith that the use is not authorised by the rights
          holder, its agent, or the law.
        </li>
        <li>
          A statement that the information in the notice is accurate, and — under penalty of
          perjury — that you are the rights holder or authorised to act on their behalf.
        </li>
        <li>Your signature, physical or electronic.</li>
      </ol>

      <CodeBlock label="Copy this and fill it in">
        {`Subject: Takedown — <skin title>

Listing: <link to the gallery card>
Work infringed: <link to or description of the original>

I am the rights holder for that work / I am authorised to act on
behalf of <rights holder>.

I believe in good faith that the use described above is not
authorised by the rights holder, its agent, or the law. The
information in this notice is accurate, and under penalty of
perjury I state that I am the rights holder or authorised to act
on their behalf.

<name>
<address or contact>
<date>`}
      </CodeBlock>

      <h2 id="what-happens">What happens next</h2>
      <ol>
        <li>
          The listing and its files are removed from the site. That is one commit and a deploy;
          the aim is same-day.
        </li>
        <li>
          The person who submitted the skin is told what was removed and why, and given your
          notice unless you ask otherwise. They may reply.
        </li>
        <li>
          The removal stands unless you withdraw the report or a counter-notice below is
          accepted.
        </li>
      </ol>
      <p>
        Removing the entry from the gallery does not reach copies people already downloaded, or
        copies hosted somewhere else with their own install links. Those are on their hosts, and
        the notice has to go to them.
      </p>

      <h2 id="counter">If your skin was removed and you think that was wrong</h2>
      <p>
        Reply to the message telling you about the removal, and include your name and contact
        details, the listing that was removed, and a statement under penalty of perjury that you
        believe in good faith it was removed by mistake or misidentification. Say plainly why —
        that you drew it, that you have a licence, that the report named the wrong listing.
      </p>
      <p>
        If the counter-notice holds up, the listing goes back. If the two sides simply disagree
        about rights, the listing stays down: this is a small gallery for a free program and it
        is not the place to settle that.
      </p>

      <h2 id="repeat">Repeat infringers</h2>
      <p>
        Someone whose submissions are removed on valid reports more than once is not listed here
        again. There is no appeal ladder and no strike counter to game — the gallery is small
        enough to be run by judgement.
      </p>

      <h2 id="bad-faith">Notices sent in bad faith</h2>
      <p>
        Misrepresenting that something infringes carries real liability for the person sending
        the notice. Do not use this route to remove art you simply dislike; the{" "}
        <Link href="/legal/content-policy">content policy</Link> is the right route for that, and
        it is read just as seriously.
      </p>
    </>
  );
}
