/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#13a4ec',
        'primary-dark': '#0e7ab5',
        'brand-cyan': '#00bcd4',
        'background-light': '#f6f7f8',
        'background-dark': '#101c22',
        'dental-blue': '#1e90ff',
      },
    },
  },
  plugins: [],
};
