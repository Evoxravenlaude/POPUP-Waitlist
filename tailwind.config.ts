/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        "mono-brand": ["'Space Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#0a0a0a",
          foreground: "#f5f5f5",
        },
        primary: {
          DEFAULT: "#FF3C00",
          foreground: "#ffffff",
        },
        muted: "#6b7280",
      },
    },
  },
  plugins: [],
};
