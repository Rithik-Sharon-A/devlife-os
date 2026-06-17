/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0d0f12",
        surface: "#161a20",
        border: "#1a1d23",
        muted: "#6b7280",
        accent: "#3b82f6",
      },
    },
  },
  plugins: [],
};
