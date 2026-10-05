import type { Metadata } from "next";
import Link from "next/link";

import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AirPlay",
  description:
    "Send this PC's audio to a HomePod or Apple TV from AorinEQ itself — what it needs, how to hear it on the speaker only, what the latency modes actually mean, and which device the volume keys drive.",
};

export default function AirPlayDocsPage() {
  return (
    <>
      <p className="eyebrow">Getting started</p>
      <h1 className="title mt-3 text-4xl text-text">AirPlay</h1>
      <p className="mt-5 text-lg text-muted">
        AorinEQ can send this PC&apos;s audio to a HomePod, an Apple TV or any other AirPlay
        receiver on your network, without a second application. There is no pairing step, no Apple
        account, and nothing to configure on the receiver.
      </p>

      <p>
        It is newer than the rest of the app and marked <strong>experimental</strong> inside it. It
        works, and it has been run for sustained sessions against real hardware, but it has had far
        less exposure than the OSD and the equalizer.
      </p>

      <h2 id="connect">Connecting</h2>
      <p>
        Open <strong>Settings → AirPlay</strong>. Receivers announce themselves on the network and
        appear in the list on their own; press <strong>Refresh</strong> if yours has not shown up
        yet, because some devices take a few seconds to answer the first query.
      </p>
      <p>
        Connecting takes about half a second, and the window does not respond while it happens.
        That is the handshake running on the UI thread — a known rough edge rather than a hang.
      </p>

      <h2 id="source">Hearing it on the speaker only</h2>
      <p>
        The <strong>Source</strong> setting decides which of this PC&apos;s playback devices is
        captured and sent. Left on the default, whatever you are already listening to is what gets
        streamed — which means it plays in both places at once.
      </p>
      <p>
        To hear it on the receiver <em>only</em>, install a virtual audio device, choose it as the
        Source, and play into it. That is the dependable route.
      </p>
      <p>
        There is a <strong>Mute this PC while streaming</strong> switch that looks like the obvious
        alternative, and it is off by default for a reason: whether muting the endpoint reaches the
        capture point depends entirely on your sound hardware. On some machines it mutes the stream
        too and you get silence everywhere.
      </p>

      <h2 id="latency">Playback modes</h2>
      <p>
        How much audio is queued ahead of the receiver. More queue means dropouts are far less
        likely, at the cost of a longer gap between what you see and what you hear — which matters
        for video and games and not at all for music.
      </p>

      <table>
        <thead>
          <tr>
            <th>Mode</th>
            <th>Queue</th>
            <th>Use it for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Real-time</strong>
            </td>
            <td>250 ms</td>
            <td>Video and games, where lip-sync matters</td>
          </tr>
          <tr>
            <td>
              <strong>Normal</strong>
            </td>
            <td>1000 ms</td>
            <td>The default. Start here.</td>
          </tr>
          <tr>
            <td>
              <strong>Buffered</strong>
            </td>
            <td>2000 ms</td>
            <td>Music on a network that stutters</td>
          </tr>
          <tr>
            <td>
              <strong>Custom</strong>
            </td>
            <td>whatever you type</td>
            <td>When none of the three is right</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>Those numbers are uncalibrated.</strong> They are reasoned guesses rather than
        measurements. The receiver reports a latency figure of its own that is demonstrably not what
        it actually buffers, so there is no honest way to derive the real values from the protocol —
        they need measuring by ear. On a healthy network the modes can be genuinely hard to tell
        apart, because nothing is being resent at any of them.
      </p>
      <p>
        Watch the <strong>resends</strong> counter under Session details. A number that climbs means
        the network is not keeping up, and a longer queue is the fix.
      </p>

      <h2 id="volume">Which device the volume keys drive</h2>
      <p>
        The stream is captured <em>after</em> Equalizer APO, which inverts what you would expect:
      </p>
      <ul>
        <li>
          <strong>In Equalizer APO preamp mode</strong>, the preamp sits upstream of the capture
          point, so your volume keys have already turned the audio down before it is sent. Set the
          receiver to 100% and the preamp controls it, exactly like a DAC. Retargeting the keys at
          the receiver as well would attenuate twice, so AorinEQ greys that setting out and explains
          why rather than silently hiding it.
        </li>
        <li>
          <strong>In Windows volume mode</strong>, endpoint volume only reaches the capture point on
          devices without hardware volume, which Microsoft documents as not contractual. Since that
          is unsafe to rely on in either direction, AorinEQ drives the receiver&apos;s own volume
          explicitly.
        </li>
      </ul>

      <h2 id="silence">Dithered silence and standby</h2>
      <p>
        Some receivers put part of their output stage to sleep during digital silence and then clip
        the first instant of the next track. <strong>Dithered silence</strong> sends an extremely
        quiet noise instead — far too soft to hear, but enough to keep the speaker awake. It is on
        by default and does not touch the music.
      </p>
      <p>
        <strong>Standby</strong> keeps the session open through silence so playback resumes
        instantly. The cost is that the receiver stays claimed by this PC and another device cannot
        take it over, so there is an optional idle timeout that hangs up after a period of quiet.
      </p>

      <h2 id="limits">What it does not do</h2>
      <ul>
        <li>
          <strong>No multi-room.</strong> One receiver at a time.
        </li>
        <li>
          <strong>No simultaneous local and AirPlay output with independent EQ chains.</strong> That
          is an audio-router problem rather than an AirPlay one.
        </li>
        <li>
          <strong>No AirPlay 2</strong>, and no receivers that require pairing.
        </li>
      </ul>

      <p className="mt-10 text-muted">
        The app&apos;s own{" "}
        <a href={`${GITHUB_URL}/blob/master/docs/reference.md#airplay`}>reference manual</a> carries
        the same material with the protocol detail attached. If the two disagree, the{" "}
        <a href={GITHUB_URL}>repository</a> is right and this page is a bug worth reporting.
      </p>

      <p className="mt-4 text-muted">
        Not sure the rest of the app is set up yet?{" "}
        <Link href="/docs/install">Install and setup</Link> covers first run.
      </p>
    </>
  );
}
