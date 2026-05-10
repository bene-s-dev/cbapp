/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}", // Scannt wirklich ALLES
  ],
  theme: {
    extend: {
      colors: {
        'duo-card': '#271a3c',
      },
    },
  },
  plugins: [],
}
