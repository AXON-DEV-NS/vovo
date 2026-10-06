"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type ConnectionInfo = {
  saveData?: boolean;
  effectiveType?: string;
};

function pickSource(mobile: boolean) {
  const base = mobile ? "/video/hero-mobile" : "/video/hero-desktop";
  const probe = document.createElement("video");
  const preferred = probe.canPlayType('video/webm; codecs="vp9"');
  return preferred ? `${base}.webm` : `${base}.mp4`;
}

export function HeroVideo() {
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    const constrained =
      Boolean(conn?.saveData) ||
      ["slow-2g", "2g", "3g"].includes(conn?.effectiveType ?? "");
    if (reduced || constrained) return;

    const attach = () =>
      setSrc(pickSource(window.matchMedia("(max-width: 767px)").matches));

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(attach, { timeout: 2500 })
      : window.setTimeout(attach, 500);

    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!src) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {
      setSrc(null);
      setPlaying(false);
    });
  }, [src]);

  useEffect(() => {
    if (!playing) return;
    document.documentElement.dataset.heroVideo = "on";
    return () => {
      delete document.documentElement.dataset.heroVideo;
    };
  }, [playing]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <picture>
        <source media="(max-width: 767px)" srcSet="/video/hero-mobile-poster.jpeg" />
        <img
          src="/video/hero-desktop-poster.jpeg"
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            playing ? "opacity-0" : "opacity-100",
          )}
        />
      </picture>

      {src ? (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            playing ? "opacity-100" : "opacity-0",
          )}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(true)}
          onError={() => {
            setPlaying(false);
            setSrc(null);
          }}
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-r from-paper/85 via-paper/50 to-paper/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-paper/60 via-transparent to-paper/60" />
    </div>
  );
}
