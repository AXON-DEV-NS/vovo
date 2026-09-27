/**
 * analytics/data-layer.ts — Typed analytics data abstraction.
 *
 * Components and API routes consume the `AnalyticsDataProvider` interface only.
 * The `MockAnalyticsProvider` is the active implementation for Phase 4.
 *
 * TODO: When the YouTube Analytics API integration is ready, implement
 * `YouTubeAnalyticsProvider` conforming to the same interface and swap it in
 * `getAnalyticsProvider()` based on whether a valid OAuth token is present.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string; // ISO date string YYYY-MM-DD
  value: number;
}

export interface VideoStat {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  watchTimeMinutes: number;
  publishedAt: string;
}

export interface ChannelAnalytics {
  channelId: string;
  channelTitle: string;
  views: TimeSeriesPoint[];
  subscriberGrowth: TimeSeriesPoint[];
  watchTimeMinutes: TimeSeriesPoint[];
  estimatedRevenue: TimeSeriesPoint[];
  topVideos: VideoStat[];
}

export type DateRangePreset = '7d' | '30d' | '90d';

export interface AnalyticsQueryParams {
  channelId: string;
  from: Date;
  to: Date;
}

export interface AnalyticsDataProvider {
  getChannelAnalytics(params: AnalyticsQueryParams): Promise<ChannelAnalytics>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSeries(
  from: Date,
  to: Date,
  baseValue: number,
  variance: number
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const current = new Date(from);
  let running = baseValue;

  while (current <= to) {
    running = Math.max(0, running + (Math.random() - 0.45) * variance);
    points.push({
      date: current.toISOString().split('T')[0],
      value: Math.round(running),
    });
    current.setDate(current.getDate() + 1);
  }
  return points;
}

// ─── Mock Provider ────────────────────────────────────────────────────────────

const MOCK_TOP_VIDEOS: VideoStat[] = [
  {
    id: 'v1',
    title: 'How AI is Changing Content Creation in 2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=320&h=180&fit=crop',
    views: 148_200,
    watchTimeMinutes: 612_000,
    publishedAt: '2026-08-12',
  },
  {
    id: 'v2',
    title: 'The Complete Guide to YouTube Automation',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=320&h=180&fit=crop',
    views: 91_500,
    watchTimeMinutes: 320_000,
    publishedAt: '2026-07-29',
  },
  {
    id: 'v3',
    title: '10 Niches That Actually Work in 2026',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=320&h=180&fit=crop',
    views: 73_800,
    watchTimeMinutes: 280_000,
    publishedAt: '2026-08-05',
  },
  {
    id: 'v4',
    title: 'AI vs Human Editors: The Honest Comparison',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=320&h=180&fit=crop',
    views: 58_400,
    watchTimeMinutes: 195_000,
    publishedAt: '2026-08-19',
  },
  {
    id: 'v5',
    title: 'Growing from 0 to 100K Subscribers with AI',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=320&h=180&fit=crop',
    views: 47_100,
    watchTimeMinutes: 170_000,
    publishedAt: '2026-08-26',
  },
];

class MockAnalyticsProvider implements AnalyticsDataProvider {
  async getChannelAnalytics(params: AnalyticsQueryParams): Promise<ChannelAnalytics> {
    return {
      channelId: params.channelId,
      channelTitle: 'Tech Insights',
      views: generateSeries(params.from, params.to, 5_000, 1_200),
      subscriberGrowth: generateSeries(params.from, params.to, 120_000, 300),
      watchTimeMinutes: generateSeries(params.from, params.to, 22_000, 5_000),
      estimatedRevenue: generateSeries(params.from, params.to, 140, 30),
      topVideos: MOCK_TOP_VIDEOS,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/** Returns the configured analytics provider for the current environment */
export function getAnalyticsProvider(): AnalyticsDataProvider {
  // TODO: swap for YouTubeAnalyticsProvider when YOUTUBE_ANALYTICS_API_KEY is set
  return new MockAnalyticsProvider();
}

/** Convenience: resolve a preset to a {from, to} range */
export function resolveDateRange(preset: DateRangePreset): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  from.setDate(from.getDate() - days);
  return { from, to };
}
