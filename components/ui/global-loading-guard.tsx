"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLoadingStore } from "@/lib/loading-store";

/**
 * Global interaction lock:
 * - Any internal navigation (single click on a link) raises the overlay
 *   immediately and releases it when the new route has rendered.
 * - Any mutating request (POST/PUT/PATCH/DELETE) raises the overlay while it
 *   is in flight, which prevents duplicate submissions (the overlay blocks
 *   pointer events) and keeps the UI honest.
 */
export function GlobalLoadingGuard() {
  const pathname = usePathname();
  const begin = useLoadingStore((s) => s.begin);
  const end = useLoadingStore((s) => s.end);
  const fetchId = useRef(0);

  // 1) Wrap fetch: lock during mutating requests.
  useEffect(() => {
    const original = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();
      const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);
      const id = `fetch-${++fetchId.current}`;

      if (isMutation) begin(id);
      try {
        return await original(input, init);
      } finally {
        if (isMutation) end(id);
      }
    };

    return () => {
      window.fetch = original;
    };
  }, [begin, end]);

  // 2) Internal link clicks: lock immediately, release when the route lands.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download") || anchor.getAttribute("target") === "_blank") return;

      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/")) return;
      if (href.startsWith("//")) return;

      begin("nav");
      // Fallback release in case the route does not change (e.g. same page).
      window.setTimeout(() => end("nav"), 2500);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [begin, end]);

  // 3) Route rendered → release the navigation lock.
  useEffect(() => {
    end("nav");
  }, [pathname, end]);

  return null;
}
