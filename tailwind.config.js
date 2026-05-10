/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/App.tsx",
    "./src/main.tsx"
  ],
  theme: {
    extend: {
      colors: {
        'duo-card': '#271a3c',
      }
    },
  },
  plugins: [],
}
