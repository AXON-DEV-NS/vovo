import React from "react";
import { COLORS } from "../brand";

/**
 * ONE icon family for the whole film: every icon is drawn on the same 48×48
 * grid with the same 3px round-cap stroke. No text, ever.
 */

export type ChoreKind = "images" | "video" | "voice" | "edit" | "publish";
export type StageKind =
  | "connect"
  | "research"
  | "script"
  | "video"
  | "voice"
  | "edit"
  | "publish"
  | "optimize";

const S = 3; // the single stroke weight of the icon family

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: S,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const ChoreIcon: React.FC<{ kind: ChoreKind; color: string }> = ({
  kind,
  color,
}) => {
  const accent = COLORS.inkMute; // muted — the "chores" are tonally quiet, not branded
  const content = (() => {
    switch (kind) {
      case "images":
        return (
          <>
            <rect x={9} y={12} width={30} height={24} rx={4.5} {...strokeProps} />
            <circle cx={18.5} cy={20.5} r={2.6} fill={accent} />
            <path d="M13.5 31.5 L20.5 24.5 L26 29.5 L31.5 23.5 L35.5 27" {...strokeProps} />
          </>
        );
      case "video":
        return (
          <>
            <rect x={8} y={12} width={32} height={24} rx={5} {...strokeProps} />
            <path d="M21 18.5 L30.5 24 L21 29.5 Z" fill={accent} />
          </>
        );
      case "voice":
        return (
          <>
            <rect x={19} y={9} width={10} height={18} rx={5} {...strokeProps} />
            <path d="M14.5 24 a9.5 9.5 0 0 0 19 0" {...strokeProps} />
            <path d="M24 33.5 V38" {...strokeProps} />
            <path d="M19 39.5 H29" {...strokeProps} />
            <path d="M10 16 a11 11 0 0 1 0 15" {...strokeProps} stroke={accent} />
            <path d="M38 16 a11 11 0 0 0 0 15" {...strokeProps} stroke={accent} />
          </>
        );
      case "edit":
        return (
          <>
            <path d="M12 18 H36" {...strokeProps} />
            <path d="M12 30 H36" {...strokeProps} />
            <circle cx={19} cy={18} r={3.4} fill={COLORS.paperHigh} stroke={accent} strokeWidth={S} />
            <circle cx={30} cy={30} r={3.4} fill={COLORS.paperHigh} stroke={accent} strokeWidth={S} />
          </>
        );
      case "publish":
        return (
          <>
            <path d="M24 31 V14" {...strokeProps} />
            <path d="M17 21 L24 14 L31 21" {...strokeProps} />
            <path d="M13 35 H35" {...strokeProps} stroke={accent} />
          </>
        );
    }
  })();
  return <g color={color}>{content}</g>;
};

export const StageIcon: React.FC<{ kind: StageKind; color: string }> = ({
  kind,
  color,
}) => {
  const content = (() => {
    switch (kind) {
      case "connect":
        return (
          <>
            <rect
              x={7}
              y={19}
              width={18}
              height={10}
              rx={5}
              transform="rotate(-38 16 24)"
              {...strokeProps}
            />
            <rect
              x={23}
              y={19}
              width={18}
              height={10}
              rx={5}
              transform="rotate(-38 32 24)"
              {...strokeProps}
            />
          </>
        );
      case "research":
        return (
          <>
            <circle cx={21} cy={21} r={9.5} {...strokeProps} />
            <path d="M28 28 L37 37" {...strokeProps} />
          </>
        );
      case "script":
        return (
          <>
            <rect x={12} y={8} width={24} height={32} rx={5} {...strokeProps} />
            <path d="M18 17 H30" {...strokeProps} />
            <path d="M18 24 H30" {...strokeProps} />
            <path d="M18 31 H25" {...strokeProps} />
          </>
        );
      case "video":
        return (
          <>
            <rect x={8} y={11} width={32} height={26} rx={6} {...strokeProps} />
            <path d="M20.5 18 L30.5 24 L20.5 30 Z" {...strokeProps} />
          </>
        );
      case "voice":
        return (
          <>
            <rect x={19} y={10} width={10} height={17} rx={5} {...strokeProps} />
            <path d="M15 25 a9 9 0 0 0 18 0" {...strokeProps} />
            <path d="M24 34 V38" {...strokeProps} />
            <path d="M19.5 39.5 H28.5" {...strokeProps} />
            <path d="M11 17 a10 10 0 0 1 0 14" {...strokeProps} />
            <path d="M37 17 a10 10 0 0 0 0 14" {...strokeProps} />
          </>
        );
      case "edit":
        return (
          <>
            <circle cx={17} cy={35} r={4} {...strokeProps} />
            <circle cx={31} cy={35} r={4} {...strokeProps} />
            <path d="M20 32 L34 11" {...strokeProps} />
            <path d="M28 32 L14 11" {...strokeProps} />
          </>
        );
      case "publish":
        return (
          <>
            <path d="M40 8 L8 21 L21 25 L25 38 Z" {...strokeProps} />
            <path d="M21 25 L40 8" {...strokeProps} />
          </>
        );
      case "optimize":
        return (
          <>
            <path d="M13 37 V29" {...strokeProps} />
            <path d="M21 37 V23" {...strokeProps} />
            <path d="M29 37 V17" {...strokeProps} />
            <path d="M37 37 V11" {...strokeProps} />
          </>
        );
    }
  })();
  return <g color={color}>{content}</g>;
};

/** The soft, shadowed disc every icon lives in (site card language). */
export const Disc: React.FC<{
  x: number;
  y: number;
  r: number;
  iconSize?: number;
  ring: string;
  fill: string;
  children: React.ReactNode;
}> = ({ x, y, r, ring, fill, children, iconSize }) => {
  return (
    <g>
      <circle cx={x} cy={y + 4} r={r} fill={COLORS.ink} opacity={0.07} />
      <circle cx={x} cy={y} r={r} fill={fill} stroke={ring} strokeWidth={3} />
      <g
        transform={`translate(${x - (iconSize ?? r * 1.22) / 2}, ${
          y - (iconSize ?? r * 1.22) / 2
        }) scale(${(iconSize ?? r * 1.22) / 48})`}
      >
        {children}
      </g>
    </g>
  );
};

/** The final check — stroke draws in with a dash reveal. */
export const CheckBadge: React.FC<{
  x: number;
  y: number;
  r: number;
  scale: number;
  draw: number; // 0..1
  opacity: number;
}> = ({ x, y, r, scale, draw, opacity }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <circle cx={0} cy={4} r={r} fill={COLORS.ink} opacity={0.07} />
      <circle cx={0} cy={0} r={r} fill={COLORS.green600} />
      <path
        d={`M ${-r * 0.42} ${r * 0.02} L ${-r * 0.12} ${r * 0.32} L ${r * 0.45} ${-r * 0.3}`}
        fill="none"
        stroke={COLORS.paperHigh}
        strokeWidth={r * 0.18}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
    </g>
  );
};
