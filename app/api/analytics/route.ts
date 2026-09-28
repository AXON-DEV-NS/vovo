import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getAnalyticsProvider, resolveDateRange, type DateRangePreset } from '@/lib/analytics/data-layer';

/**
 * Real channel analytics for a channel the signed-in user owns.
 * Returns empty series + a message when YouTube Analytics is unavailable —
 * never fabricated numbers.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database is not configured.', code: 'DB_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const channelId = searchParams.get('channelId') ?? '';
  if (!channelId) {
    return NextResponse.json({ error: 'channelId is required.' }, { status: 400 });
  }

  const preset = (searchParams.get('preset') as DateRangePreset) ?? '30d';
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const { from, to } =
    fromParam && toParam
      ? { from: new Date(fromParam), to: new Date(toParam) }
      : resolveDateRange(preset);

  // Ownership check — a user can only read analytics for their own channels.
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: session.userId }, { email: session.email.trim().toLowerCase() }],
    },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, userId: user.id },
  });
  if (!channel) {
    return NextResponse.json(
      { error: 'Channel not found or does not belong to your account.' },
      { status: 404 }
    );
  }

  const provider = getAnalyticsProvider();
  const data = await provider.getChannelAnalytics({ channel, from, to });

  return NextResponse.json(data);
}
