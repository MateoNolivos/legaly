import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Verde esmeralda LEGALY
        brand: {
          DEFAULT: "#059669", // esmeralda-600 (botones, enlaces)
          light: "#10B981", // esmeralda-500 (acentos, iconos)
          dark: "#047857", // esmeralda-700 (hover)
          deep: "#064E3B", // esmeralda-900 (fondos oscuros)
          mint: "#D1FAE5", // esmeralda-100 (fondos suaves)
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
