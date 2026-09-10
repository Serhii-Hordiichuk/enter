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
        // Gotoap messenger palette (CSS-variable driven, theme-aware).
        gotoap: {
          bg: 'var(--gotoap-bg)',
          panel: 'var(--gotoap-panel)',
          hover: 'var(--gotoap-hover)',
          active: 'var(--gotoap-active)',
          line: 'var(--gotoap-line)',
          bubble: {
            in: 'var(--gotoap-bubble-in)',
            out: 'var(--gotoap-bubble-out)',
          },
          accent: {
            DEFAULT: 'var(--gotoap-accent)',
            hover: 'var(--gotoap-accent-hover)',
            muted: 'var(--gotoap-accent-muted)',
          },
          ink: {
            DEFAULT: 'var(--gotoap-ink)',
            muted: 'var(--gotoap-ink-muted)',
            faint: 'var(--gotoap-ink-faint)',
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
