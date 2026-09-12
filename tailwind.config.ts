import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F5EFE1",
          high: "#FBF7ED",
          low: "#EDE4D0",
        },
        ink: {
          DEFAULT: "#1B1915",
          soft: "#3B372F",
          mute: "#6F6959",
          faint: "#A49C88",
        },
        green: {
          50: "#EAF0E9",
          100: "#D5E0D3",
          200: "#ABC1A8",
          300: "#82A27D",
          400: "#5D8358",
          500: "#416B41",
          600: "#335433",
          700: "#274127",
          800: "#1C2F1C",
          900: "#121F12",
        },
        gold: {
          50: "#FBF3E2",
          100: "#F6E6C4",
          200: "#EDCE8B",
          300: "#E2B354",
          400: "#D49B2E",
          500: "#C0851F",
          600: "#9C6917",
          700: "#7B5115",
          800: "#573A10",
          900: "#39260B",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-lg": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-md": ["2.5rem", { lineHeight: "1.12", letterSpacing: "-0.015em" }],
        "display-sm": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(27, 25, 21, 0.04), 0 8px 24px -12px rgba(27, 25, 21, 0.12)",
        card: "0 1px 3px rgba(27, 25, 21, 0.06), 0 12px 32px -16px rgba(27, 25, 21, 0.16)",
        lift: "0 2px 4px rgba(27, 25, 21, 0.05), 0 20px 48px -20px rgba(27, 25, 21, 0.22)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.6s ease-out",
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
export default config;
