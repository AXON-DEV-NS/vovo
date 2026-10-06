import React from "react";
import { interpolate } from "remotion";
import { COLORS, type Layout, TIMELINE } from "../brand";
import { PIPELINE_STAGES } from "../../../lib/pipeline";
import { easePremium, fadeWindow } from "../lib/motion";

const COMPLIANCE_STAGE = PIPELINE_STAGES[4]; // "Verify & optimize"

/**
 * Beat 3 — You stay in control. Real interface fragments, built from the
 * site's own components and copy: the review card ("Ready for Review" +
 * Approve / Request Changes / Reject), the compliance gate, and the honest
 * analytics empty state ("—" until real data exists).
 */
export const ControlScene: React.FC<{
  frame: number;
  layout: Layout;
  labelFont: string;
  uiFont: string;
}> = ({ frame, layout, labelFont, uiFont }) => {
  const sceneOpacity = fadeWindow(
    frame,
    TIMELINE.control.in,
    TIMELINE.control.in + 30,
    TIMELINE.control.out - 28,
    TIMELINE.control.out
  );
  if (sceneOpacity <= 0) return null;

  const mobile = layout.width < 1200;
  const s = mobile ? 1.32 : 1;
  const pad = layout.cardPad * s;
  const top = layout.centerY + layout.logoSize / 2 + (mobile ? 100 : 60);
  const gap = layout.fragmentGap * s;

  const cardBase: React.CSSProperties = {
    width: layout.cardWidth * s,
    borderRadius: 16 * s,
    border: `1px solid ${COLORS.line}`,
    background: COLORS.paperHigh,
    boxShadow:
      "0 1px 3px rgba(27,25,21,0.06), 0 12px 32px -16px rgba(27,25,21,0.16)",
    padding: pad,
    boxSizing: "border-box",
  };

  const enter = (i: number) => {
    const start = TIMELINE.control.in + i * TIMELINE.control.perCard;
    return interpolate(frame, [start, start + 26], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easePremium,
    });
  };
  const lift = (i: number) => {
    const start = TIMELINE.control.in + i * TIMELINE.control.perCard;
    return interpolate(frame, [start, start + 26, TIMELINE.control.out], [20, 0, -10], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easePremium,
    });
  };

  const eyebrow: React.CSSProperties = {
    fontFamily: uiFont,
    fontSize: 15 * s,
    fontWeight: 600,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: COLORS.inkMute,
    display: "flex",
    alignItems: "center",
    gap: 12 * s,
  };

  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: uiFont,
    fontSize: 17 * s,
    fontWeight: 600,
    color: COLORS.green700,
    background: COLORS.green50,
    border: "1px solid #ABC1A8",
    borderRadius: 9999,
    padding: `${8 * s}px ${18 * s}px`,
  };

  const btn = (variant: "primary" | "secondary" | "ghost"): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: uiFont,
    fontSize: 16 * s,
    fontWeight: 500,
    height: 42 * s,
    padding: `0 ${18 * s}px`,
    borderRadius: 10 * s,
    ...(variant === "primary"
      ? { background: COLORS.ink, color: COLORS.paperHigh }
      : variant === "secondary"
        ? { background: COLORS.paperHigh, color: COLORS.ink, border: `1px solid ${COLORS.line}` }
        : { color: COLORS.inkMute }),
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: sceneOpacity }}>
      {/* A — Review card */}
      <div
        style={{
          ...cardBase,
          position: "absolute",
          left: layout.centerX,
          top,
          transform: `translate(-50%, 0) translateY(${lift(0)}px)`,
          opacity: enter(0),
        }}
      >
        <div style={eyebrow}>Content Calendar</div>
        <div style={{ marginTop: 14 * s }}>
          <span style={chip}>Ready for Review</span>
        </div>
        <div style={{ display: "flex", gap: 10 * s, marginTop: 18 * s }}>
          <span style={btn("primary")}>Approve</span>
          <span style={btn("secondary")}>Request Changes</span>
          <span style={btn("ghost")}>Reject</span>
        </div>
      </div>

      {/* B — Compliance gate */}
      <div
        style={{
          ...cardBase,
          position: "absolute",
          left: layout.centerX,
          top: top + 168 * s + gap,
          transform: `translate(-50%, 0) translateY(${lift(1)}px)`,
          opacity: enter(1),
          display: "flex",
          alignItems: "center",
          gap: 18 * s,
        }}
      >
        <div
          style={{
            width: 56 * s,
            height: 56 * s,
            borderRadius: 16 * s,
            background: `linear-gradient(135deg, ${COLORS.green500}, ${COLORS.green700})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.paperHigh,
            flexShrink: 0,
          }}
        >
          <COMPLIANCE_STAGE.icon size={26 * s} strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: labelFont,
              fontSize: 24 * s,
              color: COLORS.ink,
              letterSpacing: "-0.01em",
            }}
          >
            {COMPLIANCE_STAGE.label}
          </div>
          <div
            style={{
              fontFamily: uiFont,
              fontSize: 15 * s,
              color: COLORS.inkMute,
              marginTop: 4 * s,
            }}
          >
            {COMPLIANCE_STAGE.description}
          </div>
        </div>
      </div>

      {/* C — Honest analytics empty state */}
      <div
        style={{
          position: "absolute",
          left: layout.centerX,
          top: top + 296 * s + gap * 2,
          transform: `translate(-50%, 0) translateY(${lift(2)}px)`,
          opacity: enter(2),
          width: layout.cardWidth * s,
        }}
      >
        <div style={{ display: "flex", gap: gap }}>
          {["Total Views", "Watch Time"].map((label) => (
            <div key={label} style={{ ...cardBase, flex: 1, padding: pad * 0.85 }}>
              <div style={{ fontFamily: uiFont, fontSize: 15 * s, color: COLORS.inkMute }}>
                {label}
              </div>
              <div
                style={{
                  fontFamily: labelFont,
                  fontSize: 40 * s,
                  color: COLORS.ink,
                  marginTop: 6 * s,
                }}
              >
                —
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontFamily: uiFont,
            fontSize: 14 * s,
            color: COLORS.inkFaint,
            textAlign: "center",
            marginTop: 12 * s,
          }}
        >
          Available after analytics sync
        </div>
      </div>
    </div>
  );
};
