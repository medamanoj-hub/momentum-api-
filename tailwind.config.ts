import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#05070f",
        surface: "#090d1a",
        card: "#0c1122",
        raise: "#111730",
        line: "#1b2340",
        ink: "#e8ecfa",
        mute: "#8b94b3",
        dim: "#5a6382",
        indigo: { DEFAULT: "#6366f1" },
        violet: { DEFAULT: "#8b5cf6" },
        azure: "#3b82f6",
        mint: "#22c55e",
        amber: "#f59e0b",
        coral: "#ef4444",
        rose: "#ec4899",
        cyan2: "#06b6d4",
        tang: "#f97316"
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(99,102,241,0.25)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 30px rgba(0,0,0,0.35)"
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulseSoft: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.55" } }
      },
      animation: {
        rise: "rise .45s cubic-bezier(.2,.7,.3,1) both",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
export default config;
