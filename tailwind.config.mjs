/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Inter", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        // ── Paleta principal CV Martorell ─────────────────────────────────
        brand: {
          light: "hsl(198 33% 62% / <alpha-value>)", // #76AFC2  – blau clar
          dark:  "hsl(200 45%  9% / <alpha-value>)", // #0D1C23  – blau fosc / fons
        },
        catalan: {
          yellow: "hsl( 47 86% 60% / <alpha-value>)", // #F2CB40  – groc
          red:    "hsl(  3 61% 47% / <alpha-value>)", // #C4372B  – vermell
        },
        secondary: {
          blue: "hsl(195 47% 33% / <alpha-value>)",   // #2B6E7F  – blau mig
        },
        ui: {
          bg:   "hsl(199 76% 92% / <alpha-value>)",   // #E2F4FB  – fons clar
          text: "hsl(197 18% 50% / <alpha-value>)",   // #6A8B96  – text suau
        },
        // ── Àlies d'aplicació (usats al BaseLayout) ───────────────────────
        app: {
          bg:   "hsl(200 45%  9% / <alpha-value>)",   // = brand-dark  → bg-app-bg
          text: "hsl(198 33% 62% / <alpha-value>)",   // = brand-light → text-app-text
        },
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.08)",
        hard: "0 10px 30px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        xl:   "1rem",
        pill: "9999px",
      },
      animation: {
        marquee: "marquee 20s linear infinite",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
