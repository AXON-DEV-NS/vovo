import React from "react";
import { COLORS } from "../brand";

/**
 * All furniture in the film's single visual language: solid fills, one
 * stroke weight family, soft contact shadows, one light direction (top-left).
 * Local frame: seated scene ground y=585 · rest scene ground y=420.
 */

export const DeskFurniture: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={COLORS.gold[300]} stopOpacity={0.34} />
        <stop offset="100%" stopColor={COLORS.gold[300]} stopOpacity={0} />
      </radialGradient>
    </defs>

    {/* ground shadow */}
    <ellipse cx={470} cy={588} rx={310} ry={14} fill={COLORS.ink} opacity={0.05} />

    {/* chair */}
    <rect x={192} y={296} width={22} height={190} rx={10} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={6} />
    <rect x={196} y={470} width={142} height={26} rx={10} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={6} />
    <rect x={210} y={496} width={15} height={89} rx={6} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={5} />
    <rect x={309} y={496} width={15} height={89} rx={6} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={5} />

    {/* desk */}
    <rect x={330} y={498} width={420} height={26} rx={10} fill={COLORS.paperLow} stroke={COLORS.line} strokeWidth={6} />
    <rect x={362} y={524} width={16} height={61} rx={7} fill={COLORS.paperHigh} stroke={COLORS.line} strokeWidth={5} />
    <rect x={700} y={524} width={16} height={61} rx={7} fill={COLORS.paperHigh} stroke={COLORS.line} strokeWidth={5} />

    {/* laptop — soft glow behind the screen */}
    <ellipse cx={610} cy={432} rx={112} ry={92} fill="url(#screenGlow)" />
    <rect x={462} y={486} width={126} height={13} rx={6} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={4.5} />
    <g transform="rotate(13 588 498)">
      <rect x={588} y={384} width={52} height={114} rx={9} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={4.5} />
      <rect x={596} y={393} width={36} height={96} rx={6} fill={COLORS.green[50]} />
    </g>

    {/* mug */}
    <rect x={700} y={456} width={34} height={42} rx={8} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={4.5} />
    <path d="M734 468 a13 13 0 0 1 0 22" fill="none" stroke={COLORS.inkSoft} strokeWidth={4.5} strokeLinecap="round" />
  </g>
);

export const RestFurniture: React.FC = () => (
  <g>
    {/* ground shadow */}
    <ellipse cx={420} cy={424} rx={400} ry={15} fill={COLORS.ink} opacity={0.05} />

    {/* couch */}
    <rect x={26} y={168} width={116} height={176} rx={22} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={6} />
    <rect x={60} y={330} width={600} height={60} rx={22} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={6} />
    <rect x={596} y={286} width={74} height={60} rx={18} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={6} />
    <rect x={90} y={390} width={16} height={30} rx={6} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={5} />
    <rect x={190} y={390} width={16} height={30} rx={6} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={5} />
    <rect x={560} y={390} width={16} height={30} rx={6} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={5} />
    <rect x={630} y={390} width={16} height={30} rx={6} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={5} />

    {/* side stool + tea */}
    <rect x={716} y={336} width={104} height={16} rx={8} fill={COLORS.paperLow} stroke={COLORS.line} strokeWidth={5} />
    <rect x={734} y={352} width={12} height={68} rx={5} fill={COLORS.paperHigh} stroke={COLORS.line} strokeWidth={4.5} />
    <rect x={790} y={352} width={12} height={68} rx={5} fill={COLORS.paperHigh} stroke={COLORS.line} strokeWidth={4.5} />
    <rect x={752} y={296} width={30} height={40} rx={7} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={4.5} />
    <path d="M782 308 a11 11 0 0 1 0 18" fill="none" stroke={COLORS.inkSoft} strokeWidth={4.5} strokeLinecap="round" />

    {/* closed laptop, put away on the floor */}
    <rect x={6} y={404} width={62} height={16} rx={6} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={4.5} />
  </g>
);

export const Clock: React.FC<{
  r: number;
  minuteAngle: number;
  hourAngle: number;
}> = ({ r, minuteAngle, hourAngle }) => (
  <g>
    <circle cx={0} cy={4} r={r} fill={COLORS.ink} opacity={0.07} />
    <circle cx={0} cy={0} r={r} fill={COLORS.paperHigh} stroke={COLORS.line} strokeWidth={4} />
    {[0, 90, 180, 270].map((a) => (
      <line
        key={a}
        x1={0}
        y1={-r * 0.78}
        x2={0}
        y2={-r * 0.62}
        stroke={COLORS.inkFaint}
        strokeWidth={3.5}
        strokeLinecap="round"
        transform={`rotate(${a})`}
      />
    ))}
    <line
      x1={0}
      y1={0}
      x2={0}
      y2={-r * 0.5}
      stroke={COLORS.inkSoft}
      strokeWidth={5.5}
      strokeLinecap="round"
      transform={`rotate(${hourAngle})`}
    />
    <line
      x1={0}
      y1={0}
      x2={0}
      y2={-r * 0.74}
      stroke={COLORS.inkSoft}
      strokeWidth={5.5}
      strokeLinecap="round"
      transform={`rotate(${minuteAngle})`}
    />
    <circle cx={0} cy={0} r={4.5} fill={COLORS.inkSoft} />
  </g>
);

const STAR_POSITIONS: readonly (readonly [number, number])[] = [
  [-1.9, -0.7],
  [-2.4, 0.5],
  [-1.1, -1.6],
  [1.9, -1.2],
  [2.5, 0.3],
  [0.6, -2.1],
];

export const Sky: React.FC<{
  r: number;
  moonOpacity: number;
  sunP: number;
  sunRot: number;
  starOpacity: number;
  phase: number;
}> = ({ r, moonOpacity, sunP, sunRot, starOpacity, phase }) => (
  <g>
    <defs>
      <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={COLORS.gold[300]} stopOpacity={0.3} />
        <stop offset="100%" stopColor={COLORS.gold[300]} stopOpacity={0} />
      </radialGradient>
    </defs>

    {STAR_POSITIONS.map(([dx, dy], i) => (
      <circle
        key={i}
        cx={dx * r}
        cy={dy * r}
        r={3.4}
        fill={COLORS.gold[400]}
        opacity={starOpacity * (0.3 + 0.7 * Math.max(0, Math.sin(phase + i * 1.1)))}
      />
    ))}

    {/* moon — fades away as the sun comes up */}
    <g opacity={moonOpacity}>
      <circle cx={0} cy={0} r={r} fill={COLORS.paperHigh} stroke={COLORS.inkSoft} strokeWidth={4.5} />
      <circle cx={-r * 0.26} cy={-r * 0.12} r={r * 0.16} fill={COLORS.paperLow} />
      <circle cx={r * 0.16} cy={r * 0.24} r={r * 0.11} fill={COLORS.paperLow} />
      <circle cx={-r * 0.02} cy={-r * 0.42} r={r * 0.07} fill={COLORS.paperLow} />
    </g>

    {/* sun — rises in place, rays turn slowly */}
    <g opacity={sunP} transform={`translate(0 ${(1 - sunP) * r * 2.2})`}>
      <circle cx={0} cy={0} r={r * 1.9} fill="url(#sunHalo)" />
      <g transform={`rotate(${sunRot})`}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a}
            x1={r * 0.98}
            y1={0}
            x2={r * 1.28}
            y2={0}
            stroke={COLORS.gold[400]}
            strokeWidth={6}
            strokeLinecap="round"
            transform={`rotate(${a})`}
          />
        ))}
      </g>
      <circle cx={0} cy={0} r={r * 0.72} fill={COLORS.gold[300]} />
    </g>
  </g>
);
