import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

/** Same typefaces as the live site: Fraunces (display) + Inter (sans). */
export const fraunces = loadFraunces("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const frauncesItalic = loadFraunces("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export const inter = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

/** Ready-to-use family names (identical to the live site's fonts). */
export const fontFamilies = {
  fraunces: fraunces.fontFamily,
  frauncesItalic: frauncesItalic.fontFamily,
  inter: inter.fontFamily,
} as const;
