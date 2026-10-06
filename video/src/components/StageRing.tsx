import React from "react";
import { interpolate } from "remotion";
import { COLORS, type Layout } from "../brand";
import { PIPELINE_STAGES } from "../../../lib/pipeline";
import { easePremium } from "../lib/motion";

const STAGE_COUNT = PIPELINE_STAGES.length;
const ANGLE_STEP = 360 / STAGE_COUNT;

const Icon: React.FC<{
  stage: (typeof PIPELINE_STAGES)[number];
  layout: Layout;
  active: boolean;
}> = ({ stage, layout, active }) => {
  const StageIcon = stage.icon;
  return (
    <div
      style={{
        width: layout.iconTile,
        height: layout.iconTile,
        borderRadius: layout.iconTile / 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${active ? COLORS.green600 : COLORS.line}`,
        background: active
          ? `linear-gradient(135deg, ${COLORS.green500}, ${COLORS.green700})`
          : COLORS.paperHigh,
        color: active ? COLORS.paperHigh : COLORS.inkSoft,
        boxShadow: active
          ? `0 10px 26px rgba(51, 84, 51, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)`
          : `0 1px 2px rgba(27,25,21,0.04), 0 8px 24px -12px rgba(27,25,21,0.12)`,
        transition: "none",
      }}
    >
      <StageIcon size={layout.iconSize} strokeWidth={2} />
    </div>
  );
};

export interface StageRingProps {
  frame: number;
  layout: Layout;
  enterStart: number;
  enterStagger: number;
  enterDuration: number;
  activationStart: number;
  perStageFrames: number;
}

/**
 * The real 8-stage production ring (same data + icons as lib/pipeline.ts).
 * Icons enter with a soft stagger, then light up one by one in order while a
 * gold→green arc tracks progress. A ±1.6° breathing wobble keeps it alive
 * without ever being loud.
 */
export const StageRing: React.FC<StageRingProps> = ({
  frame,
  layout,
  enterStart,
  enterStagger,
  enterDuration,
  activationStart,
  perStageFrames,
}) => {
  const totalActivation = STAGE_COUNT * perStageFrames;
  const activationProgress = Math.min(
    Math.max((frame - activationStart) / totalActivation, 0),
    1
  );
  const activeIndex = Math.min(
    STAGE_COUNT - 1,
    Math.max(0, Math.floor((frame - activationStart) / perStageFrames))
  );

  const wobble = Math.sin((frame / 540) * Math.PI * 2) * 1.6;

  const radius = layout.ringRadius;
  const circumference = 2 * Math.PI * radius;
  const svgSize = radius * 2 + 40;

  return (
    <div
      style={{
        position: "absolute",
        left: layout.centerX,
        top: layout.centerY,
        width: svgSize,
        height: svgSize,
        transform: `translate(-50%, -50%) rotate(${wobble}deg)`,
      }}
    >
      {/* Progress ring */}
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id="stage-arc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.green600} />
            <stop offset="100%" stopColor={COLORS.gold500} />
          </linearGradient>
        </defs>
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={COLORS.line}
          strokeWidth={1.5}
          strokeDasharray="2 10"
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="url(#stage-arc)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - circumference * activationProgress}
          opacity={activationProgress > 0 ? 1 : 0}
        />
      </svg>

      {/* Stage icons */}
      {PIPELINE_STAGES.map((stage, i) => {
        const angle = -90 + i * ANGLE_STEP;
        const rad = (angle * Math.PI) / 180;
        const x = svgSize / 2 + Math.cos(rad) * radius;
        const y = svgSize / 2 + Math.sin(rad) * radius;

        const enter = interpolate(
          frame,
          [enterStart + i * enterStagger, enterStart + i * enterStagger + enterDuration],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: easePremium,
          }
        );

        const active = i === activeIndex;

        return (
          <div
            key={stage.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${0.7 + enter * 0.3})`,
              opacity: enter,
            }}
          >
            <Icon stage={stage} layout={layout} active={active} />
          </div>
        );
      })}
    </div>
  );
};
