import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../brand";

/**
 * The site's hero-aurora layer (app/globals.css), rebuilt for video.
 * All motion is driven by Math.sin/cos with a period equal to the video
 * duration, so frame 0 and the final frame match exactly — seamless loop.
 */
export const Aurora: React.FC<{
  width: number;
  height: number;
  durationInFrames: number;
}> = ({ width, height, durationInFrames }) => {
  const frame = useCurrentFrame();
  const phase = (frame / durationInFrames) * Math.PI * 2;
  const blob = Math.max(width, height) * 0.55;

  const drift = (
    p: number,
    ampX: number,
    ampY: number,
    scaleMin: number,
    scaleMax: number
  ) => {
    const x = Math.sin(p) * ampX;
    const y = Math.cos(p) * ampY;
    const scale = scaleMin + ((Math.sin(p) + 1) / 2) * (scaleMax - scaleMin);
    return `translate(${x}px, ${y}px) scale(${scale})`;
  };

  const radial = (rgb: string, inner: number, mid: number) =>
    `radial-gradient(circle at 50% 50%, rgba(${rgb}, ${inner}) 0%, rgba(${rgb}, ${mid}) 45%, transparent 70%)`;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: -width * 0.08 + (width - blob) / 2,
          top: -height * 0.14 + (height - blob) / 2,
          width: blob,
          height: blob,
          borderRadius: 9999,
          mixBlendMode: "multiply",
          background: radial("93, 131, 88", 0.42, 0.14),
          transform: drift(phase, width * 0.03, height * 0.025, 1, 1.12),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.62,
          top: height * 0.52,
          width: blob,
          height: blob,
          borderRadius: 9999,
          mixBlendMode: "multiply",
          background: radial("226, 179, 84", 0.38, 0.12),
          transform: drift(phase + Math.PI * 0.6, width * 0.028, height * 0.03, 1.05, 0.94),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.34,
          top: height * 0.18,
          width: blob * 0.9,
          height: blob * 0.9,
          borderRadius: 9999,
          mixBlendMode: "multiply",
          background: radial("59, 55, 47", 0.18, 0.06),
          transform: drift(phase + Math.PI * 1.3, width * 0.022, height * 0.02, 0.96, 1.06),
        }}
      />
    </AbsoluteFill>
  );
};

/** Paper backdrop + the site's 2.5%-opacity grain, matching the hero section. */
export const PaperBackdrop: React.FC<{ grainUri: string }> = ({ grainUri }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <AbsoluteFill
        style={{
          backgroundImage: grainUri,
          opacity: 0.025,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
