/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#4a90e2',
        'dark-bg': '#2c2c2c',
      },
      borderRadius: {
        lg: '0.375rem',
        xl: '0.5rem',
      },
      borderWidth: {
        2: '1px',
      },
    },
  },
  plugins: [],
}




