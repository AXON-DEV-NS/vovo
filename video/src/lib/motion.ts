import { Easing, interpolate, spring, useVideoConfig } from "remotion";

/** The site's premium easing — cubic-bezier(0.32, 0.72, 0, 1). */
export const easePremium = Easing.bezier(0.32, 0.72, 0, 1);

/** Gentle, non-bouncy spring progress 0→1. */
export const springProg = (
  frame: number,
  start: number,
  durationInFrames: number,
  fps: number,
): number =>
  spring({
    frame: Math.max(0, frame - start),
    fps,
    config: { damping: 26, stiffness: 110, mass: 1.1 },
    durationInFrames,
  });

/** Smooth 0→1→0 window (used for chaos flourishes that must vanish at both ends). */
export const bump = (
  frame: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
): number =>
  interpolate(frame, [inStart, inEnd, outStart, outEnd], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Eased 0→1 with the site's premium curve. */
export const easeProg = (
  frame: number,
  start: number,
  durationInFrames: number,
): number =>
  interpolate(frame, [start, start + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easePremium,
  });

/** Linear ramp 0→1 (clamped). */
export const ramp = (
  frame: number,
  start: number,
  durationInFrames: number,
): number =>
  interpolate(frame, [start, start + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/**
 * Periodic float — integer cycle count over the composition so that
 * frame 479 → frame 0 continues with zero jump (loop contract).
 */
export const periodic = (frame: number, periodInFrames: number): number =>
  Math.sin((frame / periodInFrames) * Math.PI * 2);

export const useFps = () => useVideoConfig().fps;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Pt = readonly [number, number];

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
];

/** Lerp across a pose (record of named joints). */
export const lerpPose = <T extends Record<string, Pt>>(
  a: T,
  b: T,
  t: number,
): T => {
  const out: Record<string, Pt> = {};
  for (const key of Object.keys(a)) out[key] = lerpPt(a[key], b[key], t);
  return out as T;
};
