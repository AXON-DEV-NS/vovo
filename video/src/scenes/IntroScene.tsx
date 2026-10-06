import React from "react";
import { interpolate } from "remotion";
import { COLORS, labelBaselineY, type Layout } from "../brand";
import { PIPELINE_STAGES } from "../../../lib/pipeline";
import { fadeWindow } from "../lib/motion";

const INTRO_LABELS = [
  PIPELINE_STAGES[0].label, // "Connect channel"
  PIPELINE_STAGES[2].label, // "Research"
  PIPELINE_STAGES[5].label, // "Publish"
];

const LABEL_WINDOW = 40; // frames each label stays

/**
 * Beat 1 — What is this? The logo breathes in while three real pipeline
 * stage names cycle beneath it: connect → research → publish.
 */
export const IntroScene: React.FC<{
  frame: number;
  layout: Layout;
  labelFont: string;
}> = ({ frame, layout, labelFont }) => {
  const sceneOpacity = fadeWindow(frame, 0, 12, 118, 140);
  if (sceneOpacity <= 0) return null;

  const baseY = labelBaselineY(layout);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: sceneOpacity }}>
      {INTRO_LABELS.map((label, i) => {
        const start = 14 + i * LABEL_WINDOW;
        const local = frame - start;
        const opacity = interpolate(
          local,
          [0, 6, LABEL_WINDOW - 8, LABEL_WINDOW],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        if (local < 0 || local > LABEL_WINDOW) return null;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: layout.centerX,
              top: baseY,
              transform: `translate(-50%, 0) translateY(${(1 - opacity) * 6}px)`,
              opacity,
              fontFamily: labelFont,
              fontSize: layout.labelSize,
              color: COLORS.ink,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};
