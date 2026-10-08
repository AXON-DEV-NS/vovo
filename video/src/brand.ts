/**
 * Brand tokens — imported LIVE from the site's own tailwind config so the
 * film can never drift from the site palette. (tailwind.config.ts is the
 * source of truth; `line` lives in app/globals.css.)
 */
import tailwindConfig from "../../tailwind.config";

type SiteColors = Record<string, Record<string, string>>;
const siteColors = (tailwindConfig as unknown as {
  theme: { extend: { colors: SiteColors } };
}).theme.extend.colors;

const paper = siteColors.paper;
const ink = siteColors.ink;
const green = siteColors.green;
const gold = siteColors.gold;

export const COLORS = {
  paper: paper.DEFAULT, // #F5EFE1 — the video background MUST be this exact value
  paperHigh: paper.high,
  paperLow: paper.low,
  ink: ink.DEFAULT,
  inkSoft: ink.soft,
  inkMute: ink.mute,
  inkFaint: ink.faint,
  line: "#E3DAC5", // app/globals.css --line
  green: {
    50: green["50"],
    100: green["100"],
    200: green["200"],
    300: green["300"],
    400: green["400"],
    500: green["500"],
    600: green["600"],
    700: green["700"],
  },
  gold: {
    300: gold["300"],
    400: gold["400"],
    500: gold["500"],
    600: gold["600"],
  },
} as const;

/** THE real logo file (transparent cut of public/vovo25.jpg). Swap + re-render. */
export const LOGO_FILE = "vovo25.png";

export const FPS = 30;
export const DURATION_IN_FRAMES = 480; // 16.0s — the loop contract

/**
 * Timeline (frames @30fps) — five story beats from the brief.
 *   tired     0–120      chaos   120–210
 *   discovery 210–300    rest    300–420
 *   loop      420–480    (frame 479 ≡ frame 0)
 */
export const TIMELINE = {
  tired: { start: 0, end: 120 },
  chaos: { start: 120, end: 210 },
  discovery: { start: 210, end: 300 },
  rest: { start: 300, end: 420 },
  loop: { start: 420, end: 480 },

  poseTiredToOverwhelmed: { start: 122, dur: 50 },
  poseOverwhelmedToCalm: { start: 208, dur: 50 },
  poseCalmToTired: { start: 406, dur: 72 },

  clockIn: { start: 100, dur: 28 },
  clockOut: { start: 268, dur: 26 },
  clockChaos: { start: 125, end: 205 },

  logoIn: { start: 212, dur: 30 },
  logoOut: { start: 404, dur: 36 },
  absorb: { first: 224, stagger: 13, dur: 22 }, // 5 chore bubbles fly into the logo
  threadDraw: { start: 244, dur: 36 }, // the clean line leaves the logo
  threadComplete: { start: 332, dur: 28 }, // continues across the stage row (after the scene swap)
  stagePop: { first: 336, stagger: 3, dur: 10 },
  stageLight: { first: 352, perStage: 4, dur: 6 },
  checkDraw: { start: 386, dur: 12 },

  restFadeIn: { start: 300, dur: 34 },
  restFadeOut: { start: 404, dur: 42 },
  bubblesReturn: { start: 420, dur: 44 },
  moonToSun: { start: 316, dur: 46 },
  stars: { inStart: 306, inEnd: 330, outStart: 384, outEnd: 408 },
} as const;

export interface Layout {
  width: number;
  height: number;
  /** The allowed art zone (hero text/button safe zones, DESIGN.md §5). */
  zone: { x: number; y: number; w: number; h: number };
  /** Scene group translation (local art units × scale). */
  desk: { x: number; y: number; scale: number };
  rest: { x: number; y: number; scale: number };
  bubbles: readonly (readonly [number, number])[];
  logo: { x: number; y: number; size: number };
  stageRow: { x: number; cy: number; gap: number; r: number };
  check: { x: number; y: number; r: number };
  sky: { x: number; y: number; r: number };
  clock: { x: number; y: number; r: number };
  bubbleR: number;
}

export const LAYOUTS: Record<"desktop" | "mobile", Layout> = {
  desktop: {
    width: 1920,
    height: 1080,
    zone: { x: 1000, y: 120, w: 860, h: 840 },
    desk: { x: 726, y: 39, scale: 1.48 },
    rest: { x: 994, y: 500, scale: 1.0 },
    bubbles: [
      [1055, 325],
      [1215, 175],
      [1440, 200],
      [1745, 430],
      [1060, 615],
    ],
    logo: { x: 1500, y: 240, size: 200 },
    stageRow: { x: 1060, cy: 618, gap: 86, r: 34 },
    check: { x: 1795, y: 618, r: 26 },
    sky: { x: 1770, y: 205, r: 54 },
    clock: { x: 1795, y: 210, r: 40 },
    bubbleR: 48,
  },
  mobile: {
    width: 1080,
    height: 1920,
    zone: { x: 120, y: 1260, w: 840, h: 460 },
    desk: { x: 3, y: 1019, scale: 1.13 },
    rest: { x: 133, y: 1260, scale: 1.0 },
    bubbles: [
      [195, 1285],
      [330, 1240],
      [560, 1250],
      [790, 1315],
      [575, 1408],
    ],
    logo: { x: 152, y: 126, size: 150 },
    stageRow: { x: 334, cy: 224, gap: 62, r: 26 },
    check: { x: 848, y: 224, r: 24 },
    sky: { x: 885, y: 1325, r: 44 },
    clock: { x: 905, y: 1445, r: 34 },
    bubbleR: 44,
  },
} as const;

/** Local-frame constant: the seated character's head joint (for clustering). */
export const HEAD_LOCAL: readonly [number, number] = [318, 256];
export const DESK_GROUND_LOCAL = 585;
export const REST_GROUND_LOCAL = 420;

