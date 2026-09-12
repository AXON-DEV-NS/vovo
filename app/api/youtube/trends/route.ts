import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  isYouTubeDataConfigured,
  mineMetadata,
  searchTrendingVideos,
} from "@/lib/youtube/data-api";

/**
 * Trend detection for a niche: top videos in the last N days, enriched with
 * view velocity and mined metadata (tags / title patterns).
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isYouTubeDataConfigured()) {
    return NextResponse.json(
      { error: "YouTube Data API key is not configured.", code: "YT_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "?q= is required." }, { status: 400 });

  const days = Number(request.nextUrl.searchParams.get("days") ?? 7);
  const max = Number(request.nextUrl.searchParams.get("max") ?? 12);
  const region = request.nextUrl.searchParams.get("region") ?? undefined;

  try {
    const videos = await searchTrendingVideos({
      query: q,
      days: Number.isFinite(days) ? days : 7,
      maxResults: Number.isFinite(max) ? max : 12,
      regionCode: region,
    });

    return NextResponse.json({
      ok: true,
      query: q,
      days,
      videos,
      metadata: mineMetadata(videos),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "YOUTUBE_API_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "YouTube Data API key is not configured.", code: "YT_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    console.error("[youtube/trends]", message);
    return NextResponse.json(
      { error: "YouTube request failed. Please try again.", code: "YT_FAILED" },
      { status: 502 }
    );
  }
}
