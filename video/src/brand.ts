/**
 * Brand tokens for the hero video — mirrored 1:1 from the live site
 * (tailwind.config.ts + app/globals.css). Same palette, same easing.
 */
export const COLORS = {
  paper: "#F5EFE1",
  paperHigh: "#FBF7ED",
  paperLow: "#EDE4D0",
  ink: "#1B1915",
  inkSoft: "#3B372F",
  inkMute: "#6F6959",
  inkFaint: "#A49C88",
  line: "#E3DAC5",
  green50: "#EAF0E9",
  green100: "#D5E0D3",
  green500: "#416B41",
  green600: "#335433",
  green700: "#274127",
  gold400: "#D49B2E",
  gold500: "#C0851F",
  gold600: "#9C6917",
} as const;

/** The site's premium easing — cubic-bezier(0.32, 0.72, 0, 1). */
export const EASE_PREMIUM = [0.32, 0.72, 0, 1] as const;

export const FPS = 30;
export const DURATION_IN_FRAMES = 540; // 18s

/** Timing map for the four story beats (frames). */
export const TIMELINE = {
  intro: { in: 0, out: 140, fadeOut: 118 },
  pipeline: { in: 130, activate: 180, perStage: 21, out: 372 },
  control: { in: 352, perCard: 14, out: 486 },
  outro: { in: 474, textOut: 522 },
  loopFade: { start: 524, end: 540 },
} as const;

export interface Layout {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  ringRadius: number;
  iconTile: number;
  iconSize: number;
  logoSize: number;
  logoRadius: number;
  labelSize: number;
  subLabelSize: number;
  cardWidth: number;
  cardPad: number;
  fragmentGap: number;
}

export const LAYOUTS: Record<"desktop" | "mobile", Layout> = {  desktop: {
    width: 1920,
    height: 1080,
    centerX: 1170,
    centerY: 512,
    ringRadius: 268,
    iconTile: 92,
    iconSize: 40,
    logoSize: 148,
    logoRadius: 40,
    labelSize: 44,
    subLabelSize: 20,
    cardWidth: 520,
    cardPad: 24,
    fragmentGap: 22,
  },
  mobile: {
    width: 1080,
    height: 1920,
    centerX: 540,
    centerY: 880,
    ringRadius: 280,
    iconTile: 104,
    iconSize: 46,
    logoSize: 176,
    logoRadius: 48,
    labelSize: 60,
    subLabelSize: 28,
    cardWidth: 700,
    cardPad: 30,
    fragmentGap: 26,
  },
};

/** The site's subtle film grain (from app/globals.css). */
export const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Shared label baseline — just below the stage ring, exactly like the live
 * PipelineLoader. Every text beat (intro labels, stage names, the outro line)
 * uses this same spot so nothing ever jumps.
 */
export const labelBaselineY = (l: Layout): number =>
  l.centerY + l.ringRadius + l.iconTile / 2 + (l.width > 1200 ? 30 : 44);
