/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        mint: '#A7F3D0',
        lime: '#84CC16',
        navy: '#1E293B',
        charcoal: '#334155',
        sky: '#0EA5E9',
        coral: '#F97316',
        lavender: '#C4B5FD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
