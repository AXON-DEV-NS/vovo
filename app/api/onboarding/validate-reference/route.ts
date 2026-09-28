import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/guardian";

/**
 * Validates that the provided reference links are real, reachable YouTube URLs
 * before the client can continue onboarding:
 * - Video: resolved through YouTube's public oEmbed endpoint (no API key needed).
 * - Channel: verified through the YouTube Data API when a key is configured,
 *   with a direct page-reachability check as a fallback.
 */

const FETCH_TIMEOUT_MS = 8000;

function extractVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const m = url.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
    if (m) return m[2];
  }
  return null;
}

async function validateVideo(raw: string): Promise<{ ok: boolean; title?: string; error?: string }> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "This is not a valid link." };
  }
  const id = extractVideoId(url);
  if (!id) {
    return { ok: false, error: "Use a direct YouTube video link (youtube.com/watch?v=… or youtu.be/…)." };
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${id}`
      )}&format=json`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    if (res.status === 200) {
      const data = (await res.json().catch(() => ({}))) as { title?: string };
      return { ok: true, title: data.title };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "This video is private or embedding is disabled." };
    }
    return { ok: false, error: "This video is not available on YouTube." };
  } catch {
    return { ok: false, error: "Could not reach YouTube to verify this video. Try again." };
  }
}

async function validateChannel(raw: string): Promise<{ ok: boolean; title?: string; error?: string }> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "This is not a valid link." };
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "youtube.com" && host !== "m.youtube.com") {
    return { ok: false, error: "Use a youtube.com channel link." };
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[0];
  const value = parts[1];
  let apiParam: string | null = null;
  if (kind === "channel" && value?.startsWith("UC")) apiParam = `id=${encodeURIComponent(value)}`;
  else if (kind?.startsWith("@")) apiParam = `forHandle=${encodeURIComponent(kind)}`;
  else if ((kind === "c" || kind === "user") && value) apiParam = `forUsername=${encodeURIComponent(value)}`;

  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (apiKey && apiParam) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&${apiParam}&key=${apiKey}`,
        { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
      );
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          items?: { snippet?: { title?: string } }[];
        };
        const item = data.items?.[0];
        if (item?.snippet?.title) {
          return { ok: true, title: item.snippet.title };
        }
        return { ok: false, error: "No channel found at this link." };
      }
    } catch {
      // fall through to the reachability check
    }
  }

  // Fallback: make sure the page actually exists on YouTube.
  try {
    const res = await fetch(`https://www.youtube.com/${parts.join("/")}`, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; VOVO-Agent-AI/1.0)" },
    });
    if (res.status === 200) return { ok: true };
    if (res.status === 404) return { ok: false, error: "No channel found at this link." };
    return { ok: false, error: `YouTube replied with status ${res.status}.` };
  } catch {
    return { ok: false, error: "Could not reach YouTube to verify this channel. Try again." };
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkRateLimit(`onboarding_validate_${session.userId}`, 15, 60000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many checks. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const channelUrl = typeof body.channelUrl === "string" ? body.channelUrl.trim() : "";
  const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";

  if (!channelUrl || !videoUrl) {
    return NextResponse.json(
      { error: "Both the reference channel link and the reference video link are required." },
      { status: 400 }
    );
  }

  const [channel, video] = await Promise.all([validateChannel(channelUrl), validateVideo(videoUrl)]);

  return NextResponse.json({
    ok: channel.ok && video.ok,
    channel,
    video,
  });
}
