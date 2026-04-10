/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-purple': '#4B0082',
        'brand-blue': '#2D3ED2',
        'card-blue': '#2D3ED2',
        'card-grid': '#5B6EF5',
        'glass': 'rgba(255,255,255,0.20)',
        'glass-border': 'rgba(255,255,255,0.25)',
      },
    },
  },
  plugins: [],
};
