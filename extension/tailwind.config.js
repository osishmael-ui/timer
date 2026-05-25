/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/popup/**/*.{js,ts,jsx,tsx}',
    './src/options/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1a2733',
          900: '#0f171e',
        },
        cream: {
          50: '#faf9f6',
          100: '#f5f3ef',
        },
        mint: {
          400: '#4ade80',
          500: '#22c55e',
        },
        sky: {
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        coral: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        lavender: {
          400: '#a78bfa',
          500: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
};
