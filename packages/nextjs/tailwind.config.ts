import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "rh-lime": "#ccff00",
        "rh-warm-white": "#d4d0c8",
        "rh-warm-gray": "#b3b0ab",
        "rh-cool-gray": "#878581",
        "rh-dark": "#1c1810",
        "rh-white": "#ffffff",
        "rh-surface": "#251f13",
        "rh-surface-2": "#2e2819",
        "rh-border": "#3a3326",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#d4d0c8",
            a: { color: "#ccff00" },
            strong: { color: "#ffffff" },
            code: { color: "#ffffff" },
            h1: { color: "#ffffff", fontFamily: "var(--font-serif)" },
            h2: { color: "#ffffff", fontFamily: "var(--font-serif)" },
            h3: { color: "#ffffff", fontFamily: "var(--font-serif)" },
            li: { color: "#d4d0c8" },
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
