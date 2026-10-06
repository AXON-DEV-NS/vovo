import { Easing, interpolate } from "remotion";
import { EASE_PREMIUM } from "../brand";

/** Smooth scene opacity window: fade in, hold, fade out. */
export const fadeWindow = (
  frame: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number
): number =>
  interpolate(frame, [inStart, inEnd, outStart, outEnd], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Site easing (cubic-bezier(0.32, 0.72, 0, 1)) as a Remotion easing function. */
export const easePremium = Easing.bezier(
  EASE_PREMIUM[0],
  EASE_PREMIUM[1],
  EASE_PREMIUM[2],
  EASE_PREMIUM[3]
);

/** Soft, non-bouncy entrance for the pipeline ring icons. */
export const enterProgress = (
  frame: number,
  startFrame: number,
  durationInFrames: number
): number =>
  interpolate(frame, [startFrame, startFrame + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easePremium,
  });
