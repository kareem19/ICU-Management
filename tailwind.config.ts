import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app//*.{js,ts,jsx,tsx,mdx}",
    "./components//*.{js,ts,jsx,tsx,mdx}",
    "./lib//*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          blue: "#0369a1",
          teal: "#0d9488",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
