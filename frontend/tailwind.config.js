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
        notion: {
          lightBg: '#ffffff',
          lightSurface: '#fafafa',
          lightBorder: '#e4e4e7',
          lightText: '#09090b',
          lightMuted: '#71717a',
          darkBg: '#000000',
          darkSurface: '#09090b',
          darkBorder: '#27272a',
          darkText: '#ffffff',
          darkMuted: '#a1a1aa',
          accent: '#000000',
          accentDark: '#ffffff',
          accentHover: '#18181b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
