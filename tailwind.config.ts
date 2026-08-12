import type { Config } from "tailwindcss";

// Tailwind is used only for the authenticated app screens that don't exist
// in the original AeroMind marketing design (upload, tables, dashboard).
// The marketing pages keep the original hand-written CSS in globals.css
// untouched so the existing visual design is preserved exactly.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1B2A",
        "ink-2": "#33445A",
        mute: "#A7B3C1",
        paper: "#FDFDFC",
        accent: "#2E5BFF",
        "accent-deep": "#12308F",
        line: "rgba(14,27,42,.10)",
      },
      fontFamily: {
        display: ["Onest", "system-ui", "sans-serif"],
        body: ["Instrument Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "24px",
      },
    },
  },
  plugins: [],
};

export default config;
