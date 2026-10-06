import React from "react";
import { interpolate } from "remotion";
import { COLORS, labelBaselineY, type Layout, TIMELINE } from "../brand";
import { PIPELINE_STAGES } from "../../../lib/pipeline";
import { StageRing } from "../components/StageRing";
import { fadeWindow } from "../lib/motion";

/**
 * Beat 2 — How it works. The real 8-stage ring lights up stage by stage,
 * in order, with the exact stage names from the live site.
 */
export const PipelineScene: React.FC<{
  frame: number;
  layout: Layout;
  labelFont: string;
}> = ({ frame, layout, labelFont }) => {
  const sceneOpacity = fadeWindow(
    frame,
    TIMELINE.pipeline.in,
    TIMELINE.pipeline.in + 30,
    TIMELINE.pipeline.out - 27,
    TIMELINE.pipeline.out
  );
  if (sceneOpacity <= 0) return null;

  const { activate, perStage } = TIMELINE.pipeline;
  const activeIndex = Math.min(
    PIPELINE_STAGES.length - 1,
    Math.max(0, Math.floor((frame - activate) / perStage))
  );
  const local = frame - activate - activeIndex * perStage;
  const labelOpacity = interpolate(
    local,
    [0, 5, perStage - 6, perStage],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const label = PIPELINE_STAGES[activeIndex].label;
  const baseY = labelBaselineY(layout);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: sceneOpacity }}>
      <StageRing
        frame={frame}
        layout={layout}
        enterStart={140}
        enterStagger={5}
        enterDuration={26}
        activationStart={activate}
        perStageFrames={perStage}
      />
      <div
        key={activeIndex}
        style={{
          position: "absolute",
          left: layout.centerX,
          top: baseY,
          transform: "translate(-50%, 0)",
          opacity: labelOpacity,
          fontFamily: labelFont,
          fontSize: layout.labelSize,
          color: COLORS.ink,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};
