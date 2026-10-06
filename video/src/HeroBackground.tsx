import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  COLORS,
  GRAIN_URI,
  LAYOUTS,
  type Layout,
} from "./brand";
import { easePremium } from "./lib/motion";
import { fontFamilies, fraunces, frauncesItalic, inter } from "./fonts";
import { Aurora, PaperBackdrop } from "./components/Aurora";
import { IntroScene } from "./scenes/IntroScene";
import { PipelineScene } from "./scenes/PipelineScene";
import { ControlScene } from "./scenes/ControlScene";
import { OutroScene } from "./scenes/OutroScene";

export type HeroVariant = "desktop" | "mobile";

/**
 * VOVO Agent AI — hero background loop.
 *
 * Four quiet beats over 18s (30fps): what it is → how it works → you stay in
 * control → while you rest. Built entirely from the live site's identity:
 * paper/ink/green/gold, Fraunces + Inter, the real 8-stage pipeline, real UI
 * copy, and the actual logo. No fake numbers, no testimonials, no audio.
 *
 * The logo never moves; every text beat uses one shared baseline, so the whole
 * loop breathes without a single jump — and returns exactly to frame 0.
 */
export const HeroBackground: React.FC<{ variant: HeroVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const layout: Layout = LAYOUTS[variant];

  // Ensure the brand fonts are ready before the first frame is captured.
  const [handle] = useState(() => delayRender("Loading brand fonts"));
  useEffect(() => {
    Promise.all([
      fraunces.waitUntilDone(),
      frauncesItalic.waitUntilDone(),
      inter.waitUntilDone(),
    ])
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);

  const logoOpacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(frame, [0, 30], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easePremium,
  });
  const logoBreath = 1 + Math.sin((frame / durationInFrames) * Math.PI * 2) * 0.008;

  return (
    <AbsoluteFill>
      <PaperBackdrop grainUri={GRAIN_URI} />
      <Aurora width={width} height={height} durationInFrames={durationInFrames} />

      {/* Text beats (all share one baseline below the ring) */}
      <IntroScene frame={frame} layout={layout} labelFont={fontFamilies.fraunces} />
      <PipelineScene frame={frame} layout={layout} labelFont={fontFamilies.fraunces} />
      <ControlScene
        frame={frame}
        layout={layout}
        labelFont={fontFamilies.fraunces}
        uiFont={fontFamilies.inter}
      />
      <OutroScene frame={frame} layout={layout} italicFont={fontFamilies.frauncesItalic} />

      {/* The logo — the one constant across the whole loop */}
      <div
        style={{
          position: "absolute",
          left: layout.centerX,
          top: layout.centerY,
          transform: `translate(-50%, -50%) scale(${logoScale * logoBreath})`,
          opacity: logoOpacity,
        }}
      >
        <Img
          src={staticFile("vovo25.jpg")}
          style={{
            width: layout.logoSize,
            height: layout.logoSize,
            borderRadius: layout.logoRadius,
            objectFit: "cover",
            boxShadow:
              "0 1px 3px rgba(27,25,21,0.06), 0 12px 32px -16px rgba(27,25,21,0.16)",
            outline: `1px solid ${COLORS.line}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
