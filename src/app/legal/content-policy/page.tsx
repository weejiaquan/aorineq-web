import type { Metadata } from "next";
import Link from "next/link";

import { ContactCallout } from "@/components/ContactCallout";

export const metadata: Metadata = {
  title: "Content policy",
  description:
    "What belongs in the skin gallery, why fan art is allowed, and what gets removed.",
};

export default function ContentPolicyPage() {
  return (
    <>
      <p className="eyebrow">Policies</p>
      <h1 className="mt-3 text-4xl font-bold text-text">Content policy</h1>
      <p className="mt-5 text-lg text-muted">
        A skin is artwork someone drew to sit on their own screen. This policy says what is
        welcome in the gallery, and is written to be applied rather than admired.
      </p>

      <h2 id="fan-art">Fan art is allowed</h2>
      <p>
        Skins made from or inspired by characters, games and other existing works are welcome
        here. This is a deliberate decision, taken with the same posture as the workshops
        attached to other creative tools: skinning is a form of drawing, and a gallery that
        banned every derivative work would be a gallery of bars and gradients.
      </p>
      <p>
        That posture is only defensible if rights holders have a real route to have something
        removed. So they do: every card carries a report link, the{" "}
        <Link href="/legal/dmca">takedown page</Link> spells out what to send, and repeat
        infringers are dropped. If you are a rights holder, you do not need a lawyer or a form
        letter — a clear message naming the listing and the work is enough to start.
      </p>

      <h2 id="what-belongs">What belongs in the gallery</h2>
      <ul>
        <li>
          Artwork you drew, commissioned with the right to distribute, or are otherwise allowed
          to share.
        </li>
        <li>
          Fan art of existing characters or properties, credited plainly — say what it is drawn
          from.
        </li>
        <li>
          Assets under a licence that permits redistribution, with the licence named and any
          attribution the licence requires.
        </li>
      </ul>

      <h2 id="what-does-not">What does not</h2>
      <ul>
        <li>
          <strong>Traced or reposted work presented as your own.</strong> Crediting the artist is
          not optional, and &ldquo;found it online&rdquo; is not a credit.
        </li>
        <li>
          <strong>Ripped assets.</strong> Sprites, UI art or textures lifted wholesale out of a
          game or an application.
        </li>
        <li>
          <strong>Sexual content involving minors, or characters presented as minors.</strong>{" "}
          Removed on sight, permanently, without discussion.
        </li>
        <li>
          <strong>Explicit sexual content generally.</strong> This is a utility with no age
          gate; keep it to what is fine on a shared screen.
        </li>
        <li>
          <strong>Hate symbols and harassment.</strong> Content whose point is to demean a group
          of people, or to target a specific person.
        </li>
        <li>
          <strong>Real people used without consent</strong> in a sexual, defamatory or
          impersonating way.
        </li>
        <li>
          <strong>Anything designed to deceive.</strong> A skin that imitates a system dialog, a
          payment prompt or another program&apos;s branding to mislead the person looking at it.
        </li>
      </ul>

      <h2 id="files">The files themselves</h2>
      <p>
        A gallery skin is a zip containing only the known skin files. AorinEQ extracts by file
        name and never by the path inside the archive, so an archive cannot write outside the
        skins folder — but a zip that tries is treated as hostile and is not listed.
      </p>

      <h2 id="off-site">Skins hosted elsewhere</h2>
      <p>
        Anyone can build an <code>aorineq://install-skin</code> link for a file on their own
        host, without appearing here. Those files are not reviewed by this site and this policy
        does not reach them. A link built with the{" "}
        <Link href="/tools/skin-link">link builder</Link> is a formatting convenience, not an
        endorsement, and nothing about it is recorded here.
      </p>

      <h2 id="enforcement">How this is enforced</h2>
      <p>
        V1 has no uploads: a skin is in the gallery because its files and its manifest entry were
        committed to the site&apos;s repository, which means a person read it first. Reports go
        to the address below and are handled by removing the entry and the files, which takes one
        commit and a deploy. Removals are permanent unless the reporter withdraws the report.
      </p>
      <p>
        Somebody whose submissions are removed repeatedly is not listed again. That is the whole
        repeat-infringer rule; it is short because the gallery is small.
      </p>

      <h2 id="contact">Reporting something</h2>
      <p>
        Use the report link on any card, or write directly. Name the listing and say what is
        wrong with it — that is enough to get started.
      </p>
      <ContactCallout />
    </>
  );
}
