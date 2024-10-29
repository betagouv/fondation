/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "light-orange": "#D2BC8966",
        "light-blue": "#E8EDFF",
        "dark-blue": "#0063CB",
      },
    },
  },
  plugins: [],
};
