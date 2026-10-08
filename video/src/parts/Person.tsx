import React from "react";
import { COLORS } from "../brand";

/**
 * The VOVO pictogram person — a solid, friendly sports-pictogram figure.
 * Same body through the whole film; only joints animate (soft springs).
 * Local frame: ground at y=585, character faces +x (right).
 */

export type JointName =
  | "hip"
  | "shoulder"
  | "head"
  | "elbowN"
  | "wristN"
  | "elbowF"
  | "wristF"
  | "kneeN"
  | "ankleN"
  | "kneeF"
  | "ankleF";

export type Joints = Record<JointName, readonly [number, number]>;

export const POSE_TIRED: Joints = {
  hip: [250, 470],
  shoulder: [302, 344],
  head: [320, 262],
  elbowN: [344, 428],
  wristN: [496, 480],
  elbowF: [308, 416],
  wristF: [468, 476],
  kneeN: [372, 470],
  ankleN: [372, 562],
  kneeF: [360, 478],
  ankleF: [360, 560],
};

export const POSE_OVERWHELMED: Joints = {
  hip: [250, 470],
  shoulder: [300, 346],
  head: [306, 270],
  elbowN: [352, 492],
  wristN: [338, 314],
  elbowF: [324, 494],
  wristF: [310, 326],
  kneeN: [372, 470],
  ankleN: [372, 562],
  kneeF: [360, 478],
  ankleF: [360, 560],
};

export const POSE_CALM: Joints = {
  hip: [250, 470],
  shoulder: [300, 336],
  head: [318, 250],
  elbowN: [344, 430],
  wristN: [452, 486],
  elbowF: [292, 446],
  wristF: [258, 488],
  kneeN: [372, 470],
  ankleN: [372, 562],
  kneeF: [360, 478],
  ankleF: [360, 560],
};

/** Reclined on the couch (used inside RestScene, local ground y=420). */
export const POSE_REST: Joints = {
  hip: [316, 304],
  shoulder: [180, 244],
  head: [98, 220],
  elbowN: [216, 322],
  wristN: [306, 352],
  elbowF: [168, 296],
  wristF: [64, 272],
  kneeN: [452, 334],
  ankleN: [566, 330],
  kneeF: [446, 358],
  ankleF: [548, 352],
};

const Limb: React.FC<{
  a: readonly [number, number];
  b: readonly [number, number];
  w: number;
}> = ({ a, b, w }) => (
  <line
    x1={a[0]}
    y1={a[1]}
    x2={b[0]}
    y2={b[1]}
    stroke={COLORS.ink}
    strokeWidth={w}
    strokeLinecap="round"
  />
);

export const Person: React.FC<{ pose: Joints; breathe: number }> = ({
  pose,
  breathe,
}) => {
  return (
    <g
      style={{
        transform: `scaleY(${breathe})`,
        transformOrigin: `${pose.hip[0]}px ${pose.hip[1]}px`,
      }}
    >
      {/* far side */}
      <Limb a={pose.hip} b={pose.kneeF} w={50} />
      <Limb a={pose.kneeF} b={pose.ankleF} w={46} />
      <Limb a={pose.shoulder} b={pose.elbowF} w={40} />
      <Limb a={pose.elbowF} b={pose.wristF} w={38} />
      {/* near side */}
      <Limb a={pose.hip} b={pose.kneeN} w={54} />
      <Limb a={pose.kneeN} b={pose.ankleN} w={48} />
      <Limb a={pose.hip} b={pose.shoulder} w={88} />
      <circle cx={pose.head[0]} cy={pose.head[1]} r={52} fill={COLORS.ink} />
      <Limb a={pose.shoulder} b={pose.elbowN} w={42} />
      <Limb a={pose.elbowN} b={pose.wristN} w={40} />
    </g>
  );
};
