"use client";

import { useEffect, useRef } from "react";

/**
 * HeroCanvas — soft ambient layer behind the hero: flowing timeline waves,
 * drifting neural nodes, self-typing script lines and a cursor light glow.
 *
 * The prominent 3D production ring is handled by <HeroRing /> (DOM 3D) on
 * top of this layer; both live behind the content (z-0) and pause when the
 * hero scrolls out of view.
 */
export function HeroCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let lastTime = performance.now();

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    const INK = "27, 25, 21";
    const GREEN = "51, 84, 51";
    const GOLD = "192, 133, 31";

    // ─── Timeline waves (lower area) ───────────────────────────────────────
    const waves = Array.from({ length: 4 }, (_, i) => ({
      amp: 14 + Math.random() * 22,
      freq: 0.003 + Math.random() * 0.0028,
      speed: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      baseY: 0,
      color: i % 3 === 0 ? GREEN : i % 3 === 1 ? GOLD : INK,
      alpha: 0.04 + Math.random() * 0.03,
      lineWidth: i % 4 === 0 ? 1.6 : 1,
    }));

    // ─── Neural nodes ──────────────────────────────────────────────────────
    const nodes = Array.from({ length: 14 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00013,
      vy: (Math.random() - 0.5) * 0.00013,
      r: 1.2 + Math.random() * 2.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
      color: Math.random() < 0.5 ? GREEN : Math.random() < 0.55 ? GOLD : INK,
    }));

    // ─── Self-typing script lines (bottom-left) ────────────────────────────
    let typeProgress = 0;

    function resize() {
      const rect = wrap!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      waves.forEach((w, i) => {
        w.baseY = height * (0.64 + (0.2 * i) / (waves.length - 1));
      });
    }

    function onMouse(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
    }
    function onLeave() {
      mouse.tx = -9999;
      mouse.ty = -9999;
    }

    function draw(time: number) {
      if (width === 0 || height === 0) return;
      const t = time * 0.001;
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx!.clearRect(0, 0, width, height);

      // 1) timeline waves
      for (const w of waves) {
        ctx!.beginPath();
        for (let x = -24; x <= width + 24; x += 10) {
          const y =
            w.baseY + Math.sin(x * w.freq + w.phase + t * 0.4 * w.speed) * w.amp;
          if (x === -24) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = `rgba(${w.color}, ${w.alpha})`;
        ctx!.lineWidth = w.lineWidth;
        ctx!.stroke();
      }

      // 2) self-typing script lines (bottom-left)
      typeProgress += dt * 0.55;
      const typing = Math.floor(typeProgress * 3) % 5;
      const tx0 = width * 0.05;
      const ty0 = height * 0.82;
      for (let row = 0; row < Math.min(typing, 4); row++) {
        const wLine = row === 3 ? 54 : 86 + ((row * 23) % 40);
        ctx!.fillStyle = `rgba(${INK}, ${0.07 + row * 0.012})`;
        ctx!.beginPath();
        ctx!.roundRect(tx0, ty0 + row * 13, wLine, 4, 2);
        ctx!.fill();
      }

      // 3) neural nodes + links
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -0.06) n.x = 1.06;
        if (n.x > 1.06) n.x = -0.06;
        if (n.y < -0.06) n.y = 1.06;
        if (n.y > 1.06) n.y = -0.06;
        n.pulse += n.pulseSpeed;
      }

      const linkRange = Math.min(width, height) * 0.2;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (a.x - b.x) * width;
          const dy = (a.y - b.y) * height;
          const dist = Math.hypot(dx, dy);
          if (dist < linkRange) {
            const alpha = (1 - dist / linkRange) * 0.09;
            ctx!.strokeStyle = `rgba(${INK}, ${alpha})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x * width, a.y * height);
            ctx!.lineTo(b.x * width, b.y * height);
            ctx!.stroke();
          }
        }
      }

      const cursorActive =
        mouse.x > -150 && mouse.y > -150 && mouse.x < width + 150 && mouse.y < height + 150;
      for (const n of nodes) {
        const nx = n.x * width;
        const ny = n.y * height;
        const glow = 0.55 + Math.sin(n.pulse) * 0.45;
        let px = nx;
        let py = ny;
        if (cursorActive) {
          const dx = mouse.x - nx;
          const dy = mouse.y - ny;
          const d = Math.hypot(dx, dy);
          if (d < 200 && d > 0.001) {
            const pull = ((200 - d) / 200) * 9;
            px = nx + (dx / d) * pull;
            py = ny + (dy / d) * pull;
          }
        }
        const coreR = n.r * (0.85 + glow * 0.35);
        ctx!.fillStyle = `rgba(${n.color}, ${0.15 + glow * 0.16})`;
        ctx!.beginPath();
        ctx!.arc(px, py, coreR, 0, Math.PI * 2);
        ctx!.fill();
        const haloR = coreR * (2.4 + glow * 0.8);
        const halo = ctx!.createRadialGradient(px, py, coreR, px, py, haloR);
        halo.addColorStop(0, `rgba(${n.color}, 0.1)`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = halo;
        ctx!.beginPath();
        ctx!.arc(px, py, haloR, 0, Math.PI * 2);
        ctx!.fill();
      }

      // 4) cursor light
      if (cursorActive) {
        const radius = 320;
        const g = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, radius);
        g.addColorStop(0, `rgba(${GREEN}, 0.08)`);
        g.addColorStop(0.45, `rgba(${GOLD}, 0.04)`);
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(mouse.x - radius, mouse.y - radius, radius * 2, radius * 2);
      }
    }

    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    function start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      if (reduceMotion) draw(performance.now());
      else raf = requestAnimationFrame(loop);
    }

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        wrap!.style.opacity = visible ? "1" : "0";
        if (visible) start();
        else stop();
      },
      { threshold: 0.04 }
    );
    io.observe(wrap);

    const onVisibility = () => {
      if (document.hidden || !visible) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    resize();
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-out"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
