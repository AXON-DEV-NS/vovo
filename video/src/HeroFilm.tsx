import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, HEAD_LOCAL, LAYOUTS, TIMELINE } from "./brand";
import {
  bump,
  easeProg,
  lerp,
  lerpPose,
  periodic,
  springProg,
} from "./lib/motion";
import {
  POSE_CALM,
  POSE_OVERWHELMED,
  POSE_REST,
  POSE_TIRED,
  Person,
} from "./parts/Person";
import { Clock, DeskFurniture, RestFurniture, Sky } from "./parts/Furniture";
import {
  CheckBadge,
  ChoreIcon,
  Disc,
  StageIcon,
  type ChoreKind,
  type StageKind,
} from "./parts/icons";
import { LogoCard } from "./parts/LogoCard";

export type HeroVariant = "desktop" | "mobile";

const CHORES: readonly ChoreKind[] = ["images", "video", "voice", "edit", "publish"];
const STAGES: readonly StageKind[] = [
  "connect",
  "research",
  "script",
  "video",
  "voice",
  "edit",
  "publish",
  "optimize",
];

/** Where each chore bubble gathers around the head during the chaos beat. */
const CLUSTER_OFFSETS: readonly (readonly [number, number])[] = [
  [-150, -62],
  [-52, -165],
  [105, -138],
  [168, 10],
  [-128, 122],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const HeroFilm: React.FC<{ variant: HeroVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUTS[variant];
  const T = TIMELINE;

  // ---------- seated poses (soft springs, resolves back to tired at the loop) ----------
  const t1 = springProg(frame, T.poseTiredToOverwhelmed.start, T.poseTiredToOverwhelmed.dur, fps);
  const t2 = springProg(frame, T.poseOverwhelmedToCalm.start, T.poseOverwhelmedToCalm.dur, fps);
  const t3 = springProg(frame, T.poseCalmToTired.start, T.poseCalmToTired.dur, fps);
  const seated = lerpPose(
    lerpPose(lerpPose(POSE_TIRED, POSE_OVERWHELMED, t1), POSE_CALM, t2),
    POSE_TIRED,
    t3,
  );
  const breath = 1 + 0.012 * periodic(frame, 120);

  // ---------- beats ----------
  const restOp =
    easeProg(frame, T.restFadeIn.start, T.restFadeIn.dur) *
    (1 - easeProg(frame, T.restFadeOut.start, T.restFadeOut.dur));
  const deskOp = 1 - restOp;

  // ---------- clock (chaos beat) ----------
  const clockOp =
    easeProg(frame, T.clockIn.start, T.clockIn.dur) *
    (1 - easeProg(frame, T.clockOut.start, T.clockOut.dur));
  const chaosBump = bump(
    frame,
    T.clockChaos.start,
    T.clockChaos.start + 30,
    T.clockChaos.end - 30,
    T.clockChaos.end,
  );
  const wobble = Math.sin((frame / 40) * Math.PI * 2);
  const minuteAngle = (frame / 480) * 360 * 2 + chaosBump * 46 * wobble;
  const hourAngle = (frame / 480) * 360 * 0.62 + chaosBump * 14 * wobble;

  // ---------- logo card ----------
  const logoIn = springProg(frame, T.logoIn.start, T.logoIn.dur, fps);
  const logoOut = easeProg(frame, T.logoOut.start, T.logoOut.dur);
  const logoOp = easeProg(frame, T.logoIn.start, T.logoIn.dur) * (1 - logoOut);
  const logoScale = 0.86 + 0.14 * logoIn;

  // ---------- thread ----------
  const draw1 = easeProg(frame, T.threadDraw.start, T.threadDraw.dur);
  const draw2 = easeProg(frame, T.threadComplete.start, T.threadComplete.dur);

  // ---------- stage discs ----------
  const stagePop = (i: number) =>
    springProg(frame, T.stagePop.first + i * T.stagePop.stagger, T.stagePop.dur, fps);
  const stageOn = (i: number) =>
    easeProg(frame, T.stageLight.first + i * T.stageLight.perStage, T.stageLight.dur);

  // ---------- final check ----------
  const checkDraw = easeProg(frame, T.checkDraw.start, T.checkDraw.dur);
  const checkScale = 0.5 + 0.5 * easeProg(frame, T.checkDraw.start, 8);
  const checkOp = easeProg(frame, T.checkDraw.start, 10);

  // ---------- chore bubbles ----------
  const chaosPull = easeProg(frame, 132, 58);
  const returnProg = easeProg(frame, T.bubblesReturn.start, T.bubblesReturn.dur);
  const logoCx = L.logo.x + L.logo.size / 2;
  const logoCy = L.logo.y + L.logo.size / 2;
  const headX = L.desk.x + HEAD_LOCAL[0] * L.desk.scale;
  const headY = L.desk.y + HEAD_LOCAL[1] * L.desk.scale;

  const absorbMax = easeProg(frame, 226, 60);
  const tangleOp = bump(frame, 128, 158, 200, 232) * (1 - absorbMax) * 0.7;
  const bubbles = CHORES.map((_, i) => {
    const a = easeProg(frame, T.absorb.first + i * T.absorb.stagger, T.absorb.dur);
    const flight = a * (1 - returnProg);
    const opacity = Math.max(1 - a, returnProg);
    const [bx, by] = L.bubbles[i];
    const bobY = 7 * Math.sin((frame / 160) * Math.PI * 2 + i * 1.2);
    const x = lerp(lerp(bx, headX + CLUSTER_OFFSETS[i][0], chaosPull), logoCx, flight);
    const y = lerp(lerp(by + bobY, headY + CLUSTER_OFFSETS[i][1], chaosPull), logoCy, flight);
    const scale = (1 - 0.6 * flight) * (1 + 0.12 * returnProg * (1 - returnProg) * 4);
    return { x, y, opacity, scale };
  });

  // ---------- sky ----------
  const sunP = easeProg(frame, T.moonToSun.start + 22, T.moonToSun.dur - 22);
  const moonFade = easeProg(frame, T.moonToSun.start, 24);
  const sunRot = (frame / 480) * 360 * 2;
  const starOp = bump(frame, T.stars.inStart, T.stars.inEnd, T.stars.outStart, T.stars.outEnd);
  const starPhase = (frame / 60) * Math.PI * 2;

  // ---------- thread path (logo → across every stage → check) ----------
  const rowY = L.stageRow.cy;
  const firstX = L.stageRow.x + L.stageRow.r;
  const lastX = firstX + L.stageRow.gap * (STAGES.length - 1);
  const curvePath =
    variant === "desktop"
      ? `M ${L.logo.x + L.logo.size * 0.2} ${L.logo.y + L.logo.size} C ${L.logo.x} ${
          rowY - 60
        }, ${firstX + 200} ${rowY}, ${firstX} ${rowY}`
      : `M ${L.logo.x + L.logo.size} ${rowY} C ${L.logo.x + L.logo.size + 44} ${rowY}, ${
          firstX - 34
        } ${rowY}, ${firstX} ${rowY}`;
  const rowPath = `M ${firstX} ${rowY} L ${lastX} ${rowY} L ${L.check.x - L.check.r - 6} ${rowY}`;
  const curveLen = variant === "desktop" ? 560 : 120;
  const rowLen = variant === "desktop" ? 675 : 465;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${L.width} ${L.height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* ——— the desk (tired → chaos → discovery) ——— */}
        <g opacity={deskOp}>
          <g transform={`translate(${L.desk.x} ${L.desk.y}) scale(${L.desk.scale})`}>
            <DeskFurniture />
            <Person pose={seated} breathe={breath} />
          </g>
        </g>

        {/* ——— the rest (relief) ——— */}
        <g opacity={restOp}>
          <g transform={`translate(${L.rest.x} ${L.rest.y}) scale(${L.rest.scale})`}>
            <RestFurniture />
            <Person pose={POSE_REST} breathe={breath} />
          </g>
        </g>
        <g opacity={restOp}>
          <g transform={`translate(${L.sky.x} ${L.sky.y})`}>
            <Sky
              r={L.sky.r}
              moonOpacity={1 - moonFade}
              sunP={sunP}
              sunRot={sunRot}
              starOpacity={starOp}
              phase={starPhase}
            />
          </g>
        </g>

        {/* ——— tangled chore lines: the mess (chaos beat only, gone by discovery) ——— */}
        {([[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] as const).map(([a, b], k) => {
          const p1 = bubbles[a];
          const p2 = bubbles[b];
          const mx = (p1.x + p2.x) / 2 + (k % 2 ? 30 : -30);
          const my = (p1.y + p2.y) / 2 + (k % 2 ? -24 : 24);
          return (
            <path
              key={k}
              d={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`}
              fill="none"
              stroke={COLORS.inkFaint}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="1 9"
              opacity={tangleOp}
            />
          );
        })}

        {/* ——— chore bubbles ——— */}
        {CHORES.map((kind, i) => (
          <g
            key={kind}
            opacity={bubbles[i].opacity}
            transform={`translate(${bubbles[i].x} ${bubbles[i].y}) scale(${bubbles[i].scale})`}
          >
            <Disc x={0} y={0} r={L.bubbleR} ring={COLORS.line} fill={COLORS.paperHigh}>
              <ChoreIcon kind={kind} color={COLORS.inkMute} />
            </Disc>
          </g>
        ))}

        {/* ——— the little clock ——— */}
        <g opacity={clockOp} transform={`translate(${L.clock.x} ${L.clock.y})`}>
          <Clock r={L.clock.r} minuteAngle={minuteAngle} hourAngle={hourAngle} />
        </g>

        {/* ——— brand layer: one clean line, the stages, the check ——— */}
        <g opacity={logoOp}>
          <path
            d={curvePath}
            fill="none"
            stroke={COLORS.green[700]}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={curveLen}
            strokeDashoffset={curveLen * (1 - draw1)}
            opacity={0.9}
          />
          <path
            d={rowPath}
            fill="none"
            stroke={COLORS.green[700]}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={rowLen}
            strokeDashoffset={rowLen * (1 - draw2)}
            opacity={0.9}
          />
          {STAGES.map((kind, i) => {
            const cx = firstX + i * L.stageRow.gap;
            const pop = stagePop(i);
            const on = stageOn(i);
            const lightStart = T.stageLight.first + i * T.stageLight.perStage;
            const pulse =
              1 + 0.07 * Math.sin(Math.PI * clamp01((frame - lightStart) / 10));
            const sc = (0.55 + 0.45 * pop) * pulse;
            return (
              <g key={kind} transform={`translate(${cx} ${rowY}) scale(${sc})`} opacity={pop}>
                <g opacity={1 - on}>
                  <Disc x={0} y={0} r={L.stageRow.r} ring={COLORS.line} fill={COLORS.paperHigh}>
                    <StageIcon kind={kind} color={COLORS.inkMute} />
                  </Disc>
                </g>
                <g opacity={on}>
                  <Disc x={0} y={0} r={L.stageRow.r} ring={COLORS.green600} fill={COLORS.green[50]}>
                    <StageIcon kind={kind} color={COLORS.green600} />
                  </Disc>
                </g>
              </g>
            );
          })}
          <CheckBadge
            x={L.check.x}
            y={L.check.y}
            r={L.check.r}
            scale={checkScale}
            draw={checkDraw}
            opacity={checkOp}
          />
        </g>
      </svg>

      {/* the site's real logo (transparent PNG, unmodified) */}
      <LogoCard
        x={L.logo.x}
        y={L.logo.y}
        size={L.logo.size}
        scale={logoScale}
        opacity={logoOp}
      />
    </AbsoluteFill>
  );
};
