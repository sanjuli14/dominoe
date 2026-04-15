/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'felt': {
          '50': '#f8f7f4',
          '100': '#f0ede6',
          '200': '#e2d9ca',
          '300': '#d4c5ae',
          '400': '#c6b192',
          '500': '#1a1612',
          '600': '#16130f',
          '700': '#0d0b08',
          '800': '#0a0805',
          '900': '#050402',
        },
        'wood': {
          '900': '#1a1410',
          '800': '#2a1f15',
          '700': '#3a2f25',
        },
        'ivory': '#f5f1ed',
        'ebony': '#1c1510',
      },
      fontFamily: {
        'gaming': ['Orbitron', 'monospace'],
        'serif': ['Merriweather', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      boxShadow: {
        'ficha': '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 2px rgba(255, 255, 255, 0.3) inset',
        'neon': '0 0 10px rgba(236, 200, 154, 0.5)',
      },
    },
  },
  plugins: [],
}
