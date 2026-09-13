/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          // Custom slate shades for the deep dark theme
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      animation: {
        'gradient-shift': 'gradient-shift 4s linear infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%': { 'background-position': '0% center' },
          '100%': { 'background-position': '200% center' },
        }
      }
    },
  },
  plugins: [],
}
