/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  darkMode: "class",

  theme: {
    extend: {

      /* ─────────────────────────────────────────────
         TIPOGRAFÍA
      ────────────────────────────────────────────── */
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },

      /* ─────────────────────────────────────────────
         COLORES
         Estructura: brand / accent / ui / role
         • brand  → identidad visual del club
         • accent → colores catalanes de énfasis
         • ui     → superficies y texto semántico
         • role   → alias de propósito visual
      ────────────────────────────────────────────── */
      colors: {
        brand: {
          dark:  "#0D1C23",   // navy profundo
          mid:   "#2B6E7F",   // teal corporativo
          light: "#76AFC2",   // azul clarito acento
        },

        accent: {
          yellow: "#F2CB40",  // catalán
          red:    "#C4372B",  // catalán
        },

        ui: {
          page:     "#F5F8FA",              // fondo global (azul muy claro)
          surface:  "#FFFFFF",              // cards / modales
          muted:    "#EAF2F6",              // secciones alternadas
          border:   "rgba(13,28,35,0.08)", // bordes suaves
          text:     "#0D1C23",             // texto principal
          textSoft: "#516b75",             // texto secundario
          textMuted:"#7a8f98",             // texto tenue
        },

        // Aliases de rol — apuntan a brand para coherencia
        // Cambiar el rol aquí no rompe los tokens CSS (que también apuntan a brand-dark)
        role: {
          hero:   "#0D1C23",
          footer: "#0D1C23",
        },
      },

      /* ─────────────────────────────────────────────
         LAYOUT
      ────────────────────────────────────────────── */
      maxWidth: {
        content: "72rem",  // ~1152px, columna de contenido
        wide:    "80rem",  // ~1280px, layout ancho
      },

      /* ─────────────────────────────────────────────
         SOMBRAS
      ────────────────────────────────────────────── */
      boxShadow: {
        soft:  "0 4px 12px rgba(0,0,0,0.08)",
        card:  "0 6px 18px rgba(0,0,0,0.08)",
        hover: "0 10px 30px rgba(0,0,0,0.12)",
      },

      /* ─────────────────────────────────────────────
         BORDES
      ────────────────────────────────────────────── */
      borderRadius: {
        card: "1.25rem",
        pill: "9999px",
      },

      /* ─────────────────────────────────────────────
         ANIMACIONES
         Las keyframes están en global.css para que
         puedan ser usadas también fuera de Tailwind.
         Aquí solo registramos los nombres y duraciones.
      ────────────────────────────────────────────── */
      animation: {
        marquee:   "marquee 35s linear infinite",
        fadeIn:    "fadeIn 0.6s ease forwards",
        kenBurns:  "kenBurns 8s ease-in-out infinite alternate",
        crossfade: "crossfade 6s ease-in-out infinite",
      },

      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        fadeIn: {
          from: { opacity: "0",   transform: "translateY(20px)" },
          to:   { opacity: "1",   transform: "translateY(0)" },
        },
        kenBurns: {
          from: { transform: "scale(1)" },
          to:   { transform: "scale(1.08)" },
        },
        crossfade: {
          "0%, 45%":  { opacity: "1" },
          "55%, 100%":{ opacity: "0" },
        },
      },

    },
  },

  plugins: [],
};