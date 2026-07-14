import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        forest: {
          DEFAULT: '#0c3318',
          deep: '#0a2a14',
          panel: '#e9f1e1',
          accent: '#5cbb3f',
          accentDark: '#4fa835',
        },
      },
    },
  },
  plugins: [],
};

export default config;
