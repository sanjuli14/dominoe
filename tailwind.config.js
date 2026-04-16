/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Twitch Brand Colors
        'twitch': {
          'purple': '#9146FF',
          'purple-dark': '#5C2F8F',
          'purple-light': '#B88DFF',
          'black': '#0E0E10',
          'dark': '#18181B',
          'darker': '#1F1F23',
          'gray': '#2D2D35',
          'gray-light': '#3D3D44',
          'text': '#EFEFF1',
          'text-muted': '#ADADB8',
        },
        // Accent Colors
        'accent': {
          'live': '#E91916',
          'success': '#00F593',
          'warning': '#FFB800',
          'info': '#00D4AA',
        },
        // Felt Table Colors
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
        'gaming': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
        'serif': ['Merriweather', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 15s ease infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'twitch-glow': 'twitch-glow 2s infinite',
        'live-pulse': 'live-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #9146FF, 0 0 10px #9146FF, 0 0 15px #9146FF' },
          '100%': { boxShadow: '0 0 10px #9146FF, 0 0 20px #9146FF, 0 0 30px #9146FF' },
        },
        'twitch-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(145, 70, 255, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(145, 70, 255, 0)' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      boxShadow: {
        'ficha': '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 2px rgba(255, 255, 255, 0.3) inset',
        'neon': '0 0 20px rgba(145, 70, 255, 0.5)',
        'twitch': '0 0 20px rgba(145, 70, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
