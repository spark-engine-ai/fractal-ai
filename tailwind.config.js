/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'fractal-dark': '#0f0f0f',
        'fractal-gray': '#1a1a1a',
        'fractal-blue': '#3b82f6',
        'fractal-purple': '#8b5cf6',
        'fractal-green': '#10b981',
      },
      fontFamily: {
        'mono': ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}