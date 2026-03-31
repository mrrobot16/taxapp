import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: "#e5e7eb",
            a: { color: "#60a5fa" },
            strong: { color: "#f9fafb" },
            code: { color: "#f9fafb" },
            h1: { color: "#f9fafb" },
            h2: { color: "#f9fafb" },
            h3: { color: "#f9fafb" },
            li: { color: "#e5e7eb" },
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
