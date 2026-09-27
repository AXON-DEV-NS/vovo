"use client";

import { useEffect, useState } from "react";
import { useTransitionStore } from "@/lib/transition-store";

export function TransitionOverlay() {
  const phase = useTransitionStore((s) => s.phase);
  const origin = useTransitionStore((s) => s.origin);
  const markCovered = useTransitionStore((s) => s.markCovered);
  const reset = useTransitionStore((s) => s.reset);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (phase === "idle") return null;

  let innerStyle: React.CSSProperties = {};
  let outerPointerEvents: React.CSSProperties["pointerEvents"] = "none";

  if (phase === "expanding") {
    outerPointerEvents = "auto";
    innerStyle = {
      transformOrigin: `${origin.x}px ${origin.y}px`,
      animation:
        "transition-expand-fill 600ms cubic-bezier(0.32, 0.72, 0, 1) forwards",
    };
  } else if (phase === "covered") {
    outerPointerEvents = "auto";
    innerStyle = { transform: "scale(1)" };
  } else if (phase === "shrinking") {
    innerStyle = isDesktop
      ? {
          transformOrigin: "0% 50%",
          animation:
            "transition-shrink-panel 600ms cubic-bezier(0.32, 0.72, 0, 1) forwards",
        }
      : {
          animation: "transition-fade-out 400ms ease-out forwards",
        };
  }

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: outerPointerEvents }}
    >
      <div
        className="absolute inset-0 bg-ink"
        style={innerStyle}
        onAnimationEnd={(e) => {
          if (phase === "expanding" && e.animationName === "transition-expand-fill") {
            markCovered();
          }
          if (phase === "shrinking") {
            reset();
          }
        }}
      />
    </div>
  );
}
