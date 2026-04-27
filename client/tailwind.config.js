/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070714',
        bg2: '#0d1024',
        purple: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#7c3aed',
        },
        pink: {
          DEFAULT: '#ec4899',
          light: '#f472b6',
        },
        cyan: {
          DEFAULT: '#22d3ee',
          light: '#67e8f9',
        },
        muted: '#b7bbcc',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'score-flash': 'scoreFlash 0.6s ease-out',
        'podium-rise': 'podiumRise 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scoreFlash: {
          '0%': { backgroundColor: 'rgba(139, 92, 246, 0.4)' },
          '100%': { backgroundColor: 'transparent' },
        },
        podiumRise: {
          from: { opacity: '0', transform: 'translateY(60px) scale(0.8)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
