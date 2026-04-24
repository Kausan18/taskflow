/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // TaskFlow design tokens — reference these in components
        'tf-bg':        '#13161c',
        'tf-surface':   '#1e2128',
        'tf-surface2':  '#1a1d23',
        'tf-border':    '#2d3240',
        'tf-accent':    '#6366f1',
        'tf-green':     '#1a7a5e',
        'tf-green-hover': '#14604a',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};