import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e'
        },
        surface: {
          light: '#ffffff',
          'light-muted': '#f8fafc',
          dark: '#030712', // Darker black
          'dark-elevated': '#111827' // Slightly lighter black
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
