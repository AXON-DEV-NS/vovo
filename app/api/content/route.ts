import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getContentItems, createContentItem } from '@/lib/services/content';
import { checkUserAccess } from '@/lib/billing/subscription-service';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/security/guardian';

type ContentStatus = 'IDEA' | 'SCRIPT' | 'GENERATING' | 'READY_FOR_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'REJECTED';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const channelId = searchParams.get('channelId') ?? undefined;
  const status = searchParams.get('status') as ContentStatus | null;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const items = await getContentItems({
    userId: session.userId,
    channelId,
    status: status ?? undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = await checkRateLimit(`content_create_${session.userId}`, 15, 60000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before creating more content.' },
      { status: 429 }
    );
  }

  const access = await checkUserAccess(session.userId, session.email);
  if (!access.hasAccess) {
    return NextResponse.json(
      {
        error: "Subscription Required",
        code: "SUBSCRIPTION_REQUIRED",
        message: access.message || "Please subscribe to a plan to start AI content generation.",
        access,
      },
      { status: 402 }
    );
  }

  const body = await request.json();
  const { channelId, title, scheduledAt } = body;

  if (!channelId || !title) {
    return NextResponse.json({ error: 'channelId and title are required' }, { status: 400 });
  }

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, userId: session.userId },
    select: { id: true },
  });
  if (!channel) {
    return NextResponse.json(
      { error: 'Channel not found or does not belong to your account' },
      { status: 404 }
    );
  }

  const item = await createContentItem({
    channelId: channel.id,
    userId: session.userId,
    title,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  });

  return NextResponse.json(item, { status: 201 });
}
