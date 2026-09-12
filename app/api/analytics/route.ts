import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getAnalyticsProvider, resolveDateRange, type DateRangePreset } from '@/lib/analytics/data-layer';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const channelId = searchParams.get('channelId') ?? 'default';
  const preset = (searchParams.get('preset') as DateRangePreset) ?? '30d';
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const { from, to } =
    fromParam && toParam
      ? { from: new Date(fromParam), to: new Date(toParam) }
      : resolveDateRange(preset);

  const provider = getAnalyticsProvider();
  const data = await provider.getChannelAnalytics({ channelId, from, to });

  return NextResponse.json(data);
}
