import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAFC",
        card: "#FFFFFF",
        line: "#E2E8F0",
        accent: {
          DEFAULT: "#1D4ED8",
          dark: "#1E40AF",
          soft: "#EFF6FF",
        },
        status: {
          approved: "#10B981",
          conditional: "#F59E0B",
          rejected: "#EF4444",
          pending: "#6366F1",
        },
        risk: {
          low: "#10B981",
          medium: "#F59E0B",
          high: "#F97316",
          critical: "#DC2626",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
