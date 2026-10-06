import React from "react";
import { interpolate } from "remotion";
import { COLORS, labelBaselineY, type Layout, TIMELINE } from "../brand";
import { PIPELINE_STAGES } from "../../../lib/pipeline";
import { fadeWindow } from "../lib/motion";

/** Beat 4 — The payoff, using the real final stage name: "While you rest". */
export const OutroScene: React.FC<{
  frame: number;
  layout: Layout;
  italicFont: string;
}> = ({ frame, layout, italicFont }) => {
  const sceneOpacity = fadeWindow(
    frame,
    TIMELINE.outro.in,
    TIMELINE.outro.in + 30,
    TIMELINE.outro.textOut,
    TIMELINE.outro.textOut + 16
  );
  if (sceneOpacity <= 0) return null;

  const local = frame - TIMELINE.outro.in;
  const rise = interpolate(local, [0, 30], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: layout.centerX,
        top: labelBaselineY(layout),
        transform: `translate(-50%, 0) translateY(${rise}px)`,
        opacity: sceneOpacity,
        fontFamily: italicFont,
        fontSize: layout.labelSize * 1.18,
        color: COLORS.green700,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {PIPELINE_STAGES[7].label}.
    </div>
  );
};
