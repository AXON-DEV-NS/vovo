"use client";

import { useEffect } from "react";

/**
 * Keeps the browser address bar / status bar "theme-color" in sync with
 * the user's operating-system appearance preference, and reacts to live
 * changes (e.g. toggling Light/Dark in the OS while the tab is open).
 *
 * Colors are the site's design tokens:
 *   - Light → Cream Beige  (#F5EFE1, the `paper` color)
 *   - Dark  → Near-Black   (#1B1915, the `ink` color)
 */
const THEME_LIGHT = "#F5EFE1";
const THEME_DARK = "#1B1915";

export function ThemeColorSync() {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const color = mql.matches ? THEME_DARK : THEME_LIGHT;

      let meta = document.querySelector<HTMLMetaElement>(
        'meta[name="theme-color"]'
      );
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      meta.content = color;

      // iOS standalone status bar
      let apple = document.querySelector<HTMLMetaElement>(
        'meta[name="apple-mobile-web-app-status-bar-style"]'
      );
      if (!apple) {
        apple = document.createElement("meta");
        apple.name = "apple-mobile-web-app-status-bar-style";
        document.head.appendChild(apple);
      }
      apple.content = mql.matches ? "black-translucent" : "default";
    };

    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  return null;
}
