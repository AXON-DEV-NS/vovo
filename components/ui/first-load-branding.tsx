"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { PipelineLoader } from "@/components/ui/pipeline-loader";

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/channels",
  "/niche",
  "/content-calendar",
  "/analytics",
  "/settings",
  "/support",
  "/onboarding",
  "/vovo-hq-secure-gateway",
];

/**
 * FirstLoadBranding — the branded glass screen.
 *
 * Shown at most ONCE per full document load, and only inside the app area
 * (dashboard / admin), for a very short moment. Internal navigation and data
 * fetches never trigger it: those rely on content skeletons and inline button
 * states so nothing blocks the UI.
 *
 * Skipped entirely for prefers-reduced-motion users.
 */
export function FirstLoadBranding() {
  const [state, setState] = useState<"idle" | "visible" | "leaving" | "done">("idle");

  useEffect(() => {
    // Shown once per full document load — never on soft navigation.
    const w = window as unknown as { __vovoFirstLoadShown?: boolean };
    if (w.__vovoFirstLoadShown) return;
    w.__vovoFirstLoadShown = true;

    const path = window.location.pathname;
    const isAppRoute = APP_ROUTE_PREFIXES.some(
      (p) => path === p || path.startsWith(`${p}/`)
    );
    if (!isAppRoute) return;

    // Decorative — skip entirely when the user asked for reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setState("visible");
    const hold = window.setTimeout(() => setState("leaving"), 780);
    const done = window.setTimeout(() => setState("done"), 1280);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(done);
    };
  }, []);

  if (state === "idle" || state === "done") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="VOVO Agent AI"
      className={cn(
        "fixed inset-0 z-[9998] flex items-center justify-center bg-paper/60 backdrop-blur-md transition-opacity duration-500 ease-out",
        state === "leaving" && "pointer-events-none opacity-0"
      )}
    >
      <PipelineLoader />
    </div>
  );
}
