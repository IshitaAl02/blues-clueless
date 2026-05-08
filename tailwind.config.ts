import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#093C5D",       // deep navy
        ocean: "#3B7597",     // mid blue
        sky: "#6FD1D7",       // cyan
        mint: "#5DF8D8",      // mint
        cloud: "#F2FBFC",     // tinted off-white
      },
      fontFamily: {
        display: ["Fredoka", "system-ui", "sans-serif"],
        body: ["Quicksand", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pop: "0 6px 0 0 #093C5D",
        popSm: "0 4px 0 0 #093C5D",
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #5DF8D8 0%, #6FD1D7 40%, #3B7597 100%)",
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        wiggle: "wiggle 1.6s ease-in-out infinite",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
