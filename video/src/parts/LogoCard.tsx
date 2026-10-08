import React from "react";
import { Img, staticFile } from "remotion";
import { LOGO_FILE } from "../brand";

/**
 * The site's REAL logo — a transparent cut of public/vovo25.jpg (vovo25.png).
 * The design is untouched: black V + the four green dots + the mark's own soft
 * tail texture. No card, no box, no halo — it sits directly on the cream.
 * Swap LOGO_FILE in brand.ts to change it.
 */
export const LogoCard: React.FC<{
  x: number;
  y: number;
  size: number;
  scale: number;
  opacity: number;
}> = ({ x, y, size, scale, opacity }) => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: "50% 50%",
    }}
  >
    <Img
      src={staticFile(LOGO_FILE)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  </div>
);
