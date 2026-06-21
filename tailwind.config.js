/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eb-yellow': '#FFF512',
        'gold': '#FFDE40',
        'orig-yellow': '#EBB014',
        'harvest': '#DE8D00',
        'tan': '#9C4100',
        'black': '#090907',
        'card-bg': '#12120e',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'glow-yellow': '0 0 15px rgba(255, 245, 18, 0.45)',
        'glow-gold': '0 0 15px rgba(255, 222, 64, 0.45)',
        'glow-yellow-sm': '0 0 8px rgba(255, 245, 18, 0.3)',
      }
    },
  },
  plugins: [],
}
