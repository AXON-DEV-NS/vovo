import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { checkUserAccess } from "@/lib/billing/subscription-service";

const MAX_STEP = 8;

/**
 * Onboarding state — the single source of truth for the guided setup flow.
 *
 * GET   → current step + everything already configured (resume support).
 * PATCH → persist the current step / completion / tour-dismissal flags.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured.", code: "DB_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: session.userId }, { email: session.email.trim().toLowerCase() }],
    },
    select: {
      id: true,
      email: true,
      name: true,
      onboardingStep: true,
      onboardingCompletedAt: true,
      tourSeenAt: true,
      welcomeSeenAt: true,
      customInstructions: true,
      channels: {
        orderBy: { connectedAt: "asc" },
        take: 1,
        select: {
          id: true,
          youtubeId: true,
          title: true,
          thumbnailUrl: true,
          subscriberCount: true,
          videoCount: true,
          niche: true,
          markets: true,
          requiresAvatar: true,
          referenceChannelUrl: true,
          referenceVideoUrl: true,
          avatarImageMime: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = await checkUserAccess(user.id, user.email);
  const channel = user.channels[0] ?? null;

  return NextResponse.json({
    ok: true,
    step: Math.min(Math.max(user.onboardingStep, 1), MAX_STEP),
    completedAt: user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
    tourSeen: Boolean(user.tourSeenAt),
    welcomeSeen: Boolean(user.welcomeSeenAt),
    customInstructions: user.customInstructions ?? "",
    hasAccess: access.hasAccess,
    accessMessage: access.message,
    planName: access.planName,
    channel: channel
      ? {
          ...channel,
          hasAvatar: Boolean(channel.avatarImageMime),
          avatarImageMime: undefined,
        }
      : null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const data: {
    onboardingStep?: number;
    onboardingCompletedAt?: Date;
    tourSeenAt?: Date;
    welcomeSeenAt?: Date;
  } = {};

  if (typeof body.step === "number" && Number.isFinite(body.step)) {
    data.onboardingStep = Math.min(Math.max(Math.round(body.step), 1), MAX_STEP);
  }
  if (body.completed === true) {
    data.onboardingCompletedAt = new Date();
  }
  if (body.tourSeen === true) {
    data.tourSeenAt = new Date();
  }
  if (body.welcomeSeen === true) {
    data.welcomeSeenAt = new Date();
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: session.userId }, { email: session.email.trim().toLowerCase() }],
    },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
