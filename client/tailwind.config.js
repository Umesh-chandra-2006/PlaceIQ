/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald green base
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        zinc: {
          350: '#bebec5',
          355: '#bebec5',
          450: '#8a8a93',
          550: '#61616a',
          555: '#61616a',
          650: '#48484f',
          850: '#1f1f22',
          905: '#0f0f11',
          955: '#050506',
        },
      },
      keyframes: {
        slideOver: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        slideOver: 'slideOver 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fadeIn: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
