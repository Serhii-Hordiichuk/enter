/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class', // Dark mode by default (will set 'dark' class on html)
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        edge: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7de9fa',
          400: '#38b2db',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Gotoap messenger palette (modern Telegram-like dark theme).
        gotoap: {
          bg: '#0e1621',
          panel: '#17212b',
          hover: '#202b36',
          active: '#2b5278',
          line: '#0b141d',
          bubble: {
            in: '#182533',
            out: '#2b5278',
          },
          accent: {
            DEFAULT: '#3390ec',
            hover: '#4ea1f0',
            muted: '#5288c1',
          },
          ink: {
            DEFAULT: '#ffffff',
            muted: '#708499',
            faint: '#5f7385',
          },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
