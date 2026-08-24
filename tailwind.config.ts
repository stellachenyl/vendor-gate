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
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-jetbrains-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        card:
          "0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.06)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-row": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "check-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "70%": { transform: "scale(1.25)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-once": {
          "0%,100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-4px)" },
          "60%": { transform: "translateY(2px)" },
        },
        // SVG line drawing: elements set pathLength=100 + dasharray 100.
        "axis-draw": {
          from: { "stroke-dashoffset": "100" },
          to: { "stroke-dashoffset": "0" },
        },
        // Overdue attention pulse (red halo breathing).
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.45)" },
          "50%": { boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.12)" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out both",
        "fade-in-row": "fade-in-row 240ms ease-out both",
        "slide-up": "slide-up 250ms ease-out both",
        "scale-in": "scale-in 200ms ease-out both",
        "check-in": "check-in 200ms ease-out both",
        "bounce-once": "bounce-once 400ms ease-out",
        "axis-draw": "axis-draw 500ms ease-out forwards",
        "pulse-glow": "pulse-glow 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
