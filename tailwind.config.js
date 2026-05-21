/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        primary: {
          50: '#fdecee',
          100: '#f9d1d5',
          500: '#e5232b',
          600: '#cf1f27',
          700: '#a91b25'
        },
        secondary: {
          50: '#f4f4f3',
          500: '#646464',
          600: '#4f4f4f'
        },
        neutral: {
          50: '#dedede',
          100: '#d2d2d2',
          200: '#bbbbbb',
          500: '#6b6b6b',
          700: '#3f3f3f',
          900: '#252525'
        },
        success: '#16a34a',
        warning: '#d97706',
        danger: '#7a1f2b'
      },
      boxShadow: {
        soft: '0 24px 50px rgba(22, 10, 10, 0.28)'
      }
    }
  },
  plugins: []
};
