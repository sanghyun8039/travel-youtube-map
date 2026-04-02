import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          base:    '#0f0f0f',
          panel:   '#141414',
          card:    '#1a1a1a',
          hover:   '#1e1e1e',
          input:   '#2a2a2a',
          border:  '#2a2a2a',
        },
        accent: {
          red:     '#ef4444',
          orange:  '#f97316',
          blue:    '#1d4ed8',
        },
        text: {
          primary:   '#e5e5e5',
          secondary: '#9ca3af',
          muted:     '#6b7280',
        },
      },
    },
  },
  plugins: [],
};
export default config;
