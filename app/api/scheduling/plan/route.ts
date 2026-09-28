import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/guardian";
import { getOrBuildPlan } from "@/lib/scheduling/planner";

/**
 * GET /api/scheduling/plan[?channelId=…]
 * Returns the AI publishing plan (real signals only) for one of the user's channels.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database is not configured.", code: "DB_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const rate = await checkRateLimit(`scheduling_plan_${session.userId}`, 20, 60000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: session.userId }, { email: session.email.trim().toLowerCase() }],
    },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const requestedId = request.nextUrl.searchParams.get("channelId");
  const channel = await prisma.channel.findFirst({
    where: requestedId ? { id: requestedId, userId: user.id } : { userId: user.id },
    orderBy: { connectedAt: "asc" },
  });
  if (!channel) {
    return NextResponse.json(
      { error: "No channel found. Connect a YouTube channel first.", code: "NO_CHANNEL" },
      { status: 404 }
    );
  }

  const plan = await getOrBuildPlan(channel);
  return NextResponse.json({ ok: true, plan });
}
