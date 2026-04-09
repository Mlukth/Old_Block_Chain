/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#09313d',
        secondary: '#883c1c',
        accent: '#c87207',
        success: '#00B42A',
        warning: '#FF7D00',
        danger: '#F53F3F',
        dark: '#1D2129',
        light: '#F2F3F5',
      },
      backgroundImage: {
        'none': 'none',
      },
    },
  },
  plugins: [],
}