/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        craft: {
          primary: '#6D28D9',
          secondary: '#4F46E5',
          accent: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444',
          dark: '#0F172A',
          darker: '#020617',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 5px #6D28D9' }, '50%': { boxShadow: '0 0 20px #6D28D9, 0 0 40px #4F46E5' } }
      }
    }
  },
  plugins: []
}
