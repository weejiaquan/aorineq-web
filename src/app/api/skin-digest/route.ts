import { NextResponse } from "next/server";

import { fetchDigest } from "@/lib/remote-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Computes the SHA-256 of a hosted skin zip so the link builder can pin it.
 *
 * The digest has to be taken from the bytes the app will actually download, which means the
 * server has to fetch them — the browser cannot, because a skin host has no reason to send
 * CORS headers. Nothing is stored: the body is hashed while streaming and discarded.
 */
export async function POST(request: Request) {
  let url: unknown;
  try {
    ({ url } = (await request.json()) as { url?: unknown });
  } catch {
    return NextResponse.json({ ok: false, error: "Expected a JSON body." }, { status: 400 });
  }
  if (typeof url !== "string" || url.length === 0 || url.length > 2048) {
    return NextResponse.json(
      { ok: false, error: "Send a url string of at most 2048 characters." },
      { status: 400 },
    );
  }

  const result = await fetchDigest(url);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
