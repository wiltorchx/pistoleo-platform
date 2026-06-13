import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          400: '#facc15', // Vibrant Yellow
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          900: '#713f12'
        },
        surface: {
          light: '#ffffff',
          'light-muted': '#f8fafc',
          dark: '#000000', // True black
          'dark-elevated': '#121212' // Almost black
        },

        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      borderRadius: { 'xl': '0.75rem', '2xl': '1rem' },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
