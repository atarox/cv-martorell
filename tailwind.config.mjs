/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Usa una sans moderna; puedes cambiar por Inter, Manrope…
        sans: ["system-ui", "Segoe UI", "Inter", "Roboto", "Helvetica", "Arial", "sans-serif"]
      },
      colors: {
        brand: {
          light: "hsl(198 33% 62% / <alpha-value>)", // ~#76AFC2
          dark: "hsl(200 45% 9% / <alpha-value>)",   // ~#0D1C23
        },
        catalan: {
          yellow: "hsl(47 86% 60% / <alpha-value>)", // #F2CB40
          red: "hsl(3 61% 47% / <alpha-value>)",     // #C4372B
        },
        secondary: {
          blue: "hsl(195 47% 33% / <alpha-value>)",  // #2B6E7F
        },
        ui: {
          bg: "hsl(199 76% 92% / <alpha-value>)",    // #E2F4FB
          text: "hsl(197 18% 50% / <alpha-value>)",  // #6A8B96
        }
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.08)",
        hard: "0 10px 30px rgba(0,0,0,0.15)"
      },
      borderRadius: {
        xl: "1rem",
        pill: "9999px",
      }
    },
  },
  plugins: [
    // opcional: require('@tailwindcss/typography'), require('@tailwindcss/forms')
  ],
};