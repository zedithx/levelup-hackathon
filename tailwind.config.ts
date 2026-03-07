import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d8e7ff",
          200: "#b9d3ff",
          300: "#8eb7ff",
          400: "#5b91ff",
          500: "#336df8",
          600: "#1e51ec",
          700: "#1941d8",
          800: "#1b36af",
          900: "#1c328a",
          950: "#172053"
        }
      }
    }
  },
  plugins: []
};

export default config;
