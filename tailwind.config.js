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
        primary: {
          50: 'rgba(var(--color-primary), 0.1)',
          100: 'rgba(var(--color-primary), 0.2)',
          200: 'rgba(var(--color-primary), 0.3)',
          300: 'rgba(var(--color-primary), 0.4)',
          400: 'rgba(var(--color-primary), 0.6)',
          500: 'rgb(var(--color-primary))', // Dynamic accent color
          600: 'rgba(var(--color-primary), 0.8)',
          700: 'rgba(var(--color-primary), 0.9)',
          800: 'rgba(var(--color-primary), 0.95)',
          900: 'rgba(var(--color-primary), 1)',
          DEFAULT: 'rgb(var(--color-primary))',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neuro-light': '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7)',
        'neuro-dark': '8px 8px 16px rgba(0, 0, 0, 0.4), -8px -8px 16px rgba(255, 255, 255, 0.05)',
        'glow-orange': '0 0 20px rgba(255, 123, 0, 0.5), 0 0 40px rgba(255, 123, 0, 0.3)',
      },
    },
  },
  plugins: [],
}

