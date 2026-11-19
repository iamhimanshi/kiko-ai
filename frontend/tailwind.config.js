/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          deep: '#121212',
          surface: '#1A1A1A',
          card: '#232325',
          amber: '#FF841C',
          orange: '#E66A10',
          text: '#FFFFFF',
          muted: '#8E8E93',
          success: '#10B981',
          border: '#2E2E32',
        },
        primary: {
          DEFAULT: '#E66A10',
          hover: '#FF841C',
          pressed: '#CC5B0A',
          light: '#2E1E12',
        },
        secondary: {
          DEFAULT: '#FF841C',
          light: '#FDBA74',
          extraLight: '#232325',
        },
        gold: {
          DEFAULT: '#FF841C',
          hover: '#E66A10',
          light: '#FDBA74',
          bg: '#261A10',
        },
        bg: {
          cream: '#121212',
          white: '#1A1A1A',
          sage: '#232325',
          hover: '#2A2A2E',
          surface: '#1A1A1A',
          base: '#121212',
          elevated: '#232325',
          subtle: '#1A1A1A',
        },
        text: {
          dark: '#FFFFFF',
          slate: '#D1D5DB',
          muted: '#8E8E93',
          placeholder: '#636366',
          disabled: '#48484A',
          primary: '#FFFFFF',
          secondary: '#8E8E93',
        },
        status: {
          success: '#10B981',
          successBg: '#0F2922',
          warning: '#FF841C',
          warningBg: '#261A10',
          error: '#EF4444',
          errorBg: '#2D1616',
          muted: '#8E8E93',
          mutedBg: '#232325',
        },
        border: {
          DEFAULT: '#2E2E32',
          light: '#3A3A40',
          warm: '#FF841C',
        },
        sidebar: {
          bg: '#1A1A1A',
          logo: '#232325',
          active: '#E66A10',
          hover: '#232325',
          text: '#FFFFFF',
          inactive: '#8E8E93',
          icon: '#D1D5DB',
          divider: '#2E2E32',
        },
        chart: {
          primary: '#10B981',
          secondary: '#FF841C',
          accent: '#E66A10',
          grid: '#2E2E32',
          label: '#8E8E93',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        button: '14px',
        input: '14px',
        badge: '9999px',
      },
      boxShadow: {
        card: '0px 4px 16px rgba(0, 0, 0, 0.35)',
        hover: '0px 10px 28px rgba(0, 0, 0, 0.5)',
        amber: '0px 8px 20px rgba(230, 106, 16, 0.25)',
      },
    },
  },
  plugins: [],
};

