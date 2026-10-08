"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HeroVideo — the site's hero film (rendered in /video, committed to /public).
 *
 * Rules (locked with the approved brief):
 *  - silent, autoplay, muted, loop, playsInline
 *  - poster = the plain background colour (no image → no flash)
 *  - starts loading only AFTER the window `load` event (zero impact on Lighthouse)
 *  - prefers-reduced-motion and Data Saver → plain background only
 *  - soft CSS mask-image fades on the edges so the film melts into the page
 *  - separate mobile (<1024px) and desktop sources
 */

export function HeroVideo() {
  const [canLoad, setCanLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const constrained =
      Boolean(nav.connection?.saveData) ||
      ["slow-2g", "2g"].includes(nav.connection?.effectiveType ?? "");

    if (prefersReducedMotion || constrained) return; // pristine solid background

    const onWindowLoaded = () => {
      if ("requestIdleCallback" in window) {
        (
          window as Window & {
            requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
          }
        ).requestIdleCallback(() => setCanLoad(true), { timeout: 2500 });
      } else {
        setTimeout(() => setCanLoad(true), 300);
      }
    };

    if (document.readyState === "complete") {
      onWindowLoaded();
    } else {
      window.addEventListener("load", onWindowLoaded, { once: true });
      return () => window.removeEventListener("load", onWindowLoaded);
    }
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !canLoad) return;
    el.muted = true;
    el.play().catch(() => {});
  }, [canLoad]);

  return (
    <div
      className="hero-video-wrap absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
      style={{
        // soft edge fades — the film melts into the page (no visible seam)
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%)",
        WebkitMaskComposite: "source-in",
        maskComposite: "intersect",
      }}
    >
      {canLoad && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setIsReady(true)}
          className={`h-full w-full object-cover transition-opacity duration-1000 ease-out ${
            isReady ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundColor: "#F5EFE1" }}
        >
          {/* Desktop */}
          <source
            src="/video/hero-desktop.webm"
            type="video/webm"
            media="(min-width: 1024px)"
          />
          <source
            src="/video/hero-desktop.mp4"
            type="video/mp4"
            media="(min-width: 1024px)"
          />
          {/* Mobile & tablet */}
          <source
            src="/video/hero-mobile.webm"
            type="video/webm"
            media="(max-width: 1023px)"
          />
          <source
            src="/video/hero-mobile.mp4"
            type="video/mp4"
            media="(max-width: 1023px)"
          />
        </video>
      )}
    </div>
  );
}
