module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2399df',
        secondary: '#64dcfb',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(-45deg, #2399df, #64dcfb, #1e88d8, #1976d2)',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
