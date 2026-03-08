import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold:       "var(--gold)",
        surface:    "var(--surface)",
        surface2:   "var(--surface2)",
        loanborder: "var(--border)",
        loanmuted:  "var(--muted)",
        loangreen:  "var(--green)",
        loanred:    "var(--red)",
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
        sans:    ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
