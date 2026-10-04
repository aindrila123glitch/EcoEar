/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#060d0a',
          900: '#0b1712',
          850: '#0f2019',
          800: '#142a22',
          700: '#1b3b2f',
          600: '#255442',
          500: '#347a61',
          400: '#46a382',
          300: '#6dc4a5',
          200: '#a3dfcb',
          100: '#d5f2e8',
        },
      },
    },
  },
  plugins: [],
}
