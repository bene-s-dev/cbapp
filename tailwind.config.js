/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/App.tsx",      // Explizit die Datei nennen
    "./App.tsx"           // Falls sie doch im Root liegt
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
