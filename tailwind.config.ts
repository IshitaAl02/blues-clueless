import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B2A5B",
        navyDeep: "#081f44",
        cyanPaw: "#3DD9EB",
        cream: "#FFF8E7",
        creamDark: "#f3e9c9",
      },
      fontFamily: {
        display: ["Fredoka", "system-ui", "sans-serif"],
        body: ["Quicksand", "system-ui", "sans-serif"],
      },
      boxShadow: {
        paw: "0 4px 0 0 #0B2A5B",
      },
    },
  },
  plugins: [],
};
export default config;
