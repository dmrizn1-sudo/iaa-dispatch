import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        iaa: {
          blue: "#0B2F6B",
          blue2: "#123B85",
          gold: "#C9A227",
          gold2: "#E1C86A",
          bg: "#F7FAFF"
        }
      },
      boxShadow: {
        soft: "0 8px 30px rgba(11, 47, 107, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;

