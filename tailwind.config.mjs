/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e5ff",
          200: "#bcd1ff",
          300: "#8eb4ff",
          400: "#598bff",
          500: "#3361f6",
          600: "#1f43eb",
          700: "#1733d8",
          800: "#192daf",
          900: "#1a2c8a",
          950: "#151d54",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d4d9e3",
          300: "#aeb7ca",
          400: "#828fab",
          500: "#637191",
          600: "#4e5a78",
          700: "#404962",
          800: "#373e53",
          900: "#1f2433",
          950: "#141722",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(20,23,34,0.06), 0 8px 24px -12px rgba(20,23,34,0.12)",
        soft: "0 1px 2px rgba(20,23,34,0.04)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
