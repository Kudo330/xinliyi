/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dcf0e4',
          200: '#bae1ca',
          300: '#8fcba5',
          400: '#5eb17e',
          500: '#3d9963',
          600: '#2f7a4e',
          700: '#276140',
          800: '#224e35',
          900: '#1d412c',
        },
        warm: {
          50: '#fef7f0',
          100: '#fdecdb',
          200: '#fad4b0',
          300: '#f5b57d',
          400: '#ee8d42',
          500: '#e86d18',
          600: '#c75610',
          700: '#a34310',
          800: '#833713',
          900: '#6a2f11',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
