/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        leaf: {
          50: '#f1f8ed',
          100: '#dcefd4',
          200: '#bee2ae',
          300: '#9ed586',
          400: '#6fc05d',
          500: '#48a23f',
          600: '#398232',
          650: '#33752c',
          700: '#2d6f2c',
          750: '#245823',
          800: '#1c451b',
          850: '#1a4219',
          900: '#173f1a',
          950: '#0c2411'
        },
        soil: '#8a5a32',
        cream: '#fff8ec'
      },
      boxShadow: {
        glow: '0 20px 80px rgba(20, 83, 45, 0.25)'
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        fadeUp: 'fadeUp .8s ease both'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' }
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(24px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
};
