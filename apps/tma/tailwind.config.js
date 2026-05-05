/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: '#A78BFA',
        'accent-dim': 'rgba(167,139,250,0.20)',
      },
    },
  },
  plugins: [],
};
