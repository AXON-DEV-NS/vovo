import { NextRequest, NextResponse } from "next/server";
import {
  KnowledgeBaseUnavailableError,
  runDailyResearch,
} from "@/lib/niche/service";

/**
 * Daily scheduled research job — invoked automatically by Vercel Cron
 * (see vercel.json) and callable manually for verification.
 *
 * Authorization: in production, Vercel Cron sends
 * `Authorization: Bearer ${CRON_SECRET}` on every request.
 */
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  try {
    const summary = await runDailyResearch();

    console.log(
      `[cron/daily-research] ran at ${startedAt} — processed ${summary.processed} niche(s): ${JSON.stringify(summary)}`
    );

    return NextResponse.json({ ok: true, startedAt, summary });
  } catch (error) {
    if (error instanceof KnowledgeBaseUnavailableError) {
      console.warn(
        `[cron/daily-research] skipped at ${startedAt}: ${error.message}`
      );
      return NextResponse.json(
        { ok: false, error: error.message, code: "db_not_configured" },
        { status: 503 }
      );
    }
    console.error(`[cron/daily-research] failed at ${startedAt}`, error);
    return NextResponse.json(
      { ok: false, error: "The research job failed." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
