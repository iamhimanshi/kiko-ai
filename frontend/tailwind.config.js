/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Forest Green
        primary: {
          DEFAULT: '#1B4332',
          hover: '#24543F',
          pressed: '#163426',
          light: '#DDEEDF',
        },
        // Secondary Green
        secondary: {
          DEFAULT: '#4F8A63',
          light: '#A9D3B0',
          extraLight: '#EEF7F0',
        },
        // Gold Accent
        gold: {
          DEFAULT: '#D4A64A',
          hover: '#C9962E',
          light: '#F7E5B5',
          bg: '#FFF8E8',
        },
        // Backgrounds - THESE WERE MISSING
        bg: {
          cream: '#F8F7F2',
          white: '#FFFFFF',
          sage: '#F2F5EF',
          hover: '#EDF4EE',
          surface: '#F8F7F2',  // Added alias
          base: '#F8F7F2',     // Added alias
          elevated: '#FFFFFF', // Added alias
          subtle: '#F2F5EF',   // Added alias
        },
        // Text
        text: {
          dark: '#1F2937',
          slate: '#4B5563',
          muted: '#6B7280',
          placeholder: '#9CA3AF',
          disabled: '#D1D5DB',
          primary: '#1F2937',   // Added alias
          secondary: '#4B5563', // Added alias
        },
        // Status
        status: {
          success: '#2E7D32',
          successBg: '#EAF8EC',
          warning: '#D97706',
          warningBg: '#FFF6E4',
          error: '#D14343',
          errorBg: '#FDECEC',
          muted: '#6B7280',
          mutedBg: '#F3F4F6',
        },
        // Border
        border: {
          DEFAULT: '#E8ECE7',
          light: '#DDE6DD',
        },
        // Sidebar
        sidebar: {
          bg: '#163020',
          logo: '#1B4332',
          active: '#2E5A43',
          hover: '#244535',
          text: '#FFFFFF',
          inactive: '#C9D6CB',
          icon: '#E6F2E7',
          divider: '#2C493A',
        },
        // Charts
        chart: {
          primary: '#2D6A4F',
          secondary: '#D4A64A',
          grid: '#E8ECE7',
          label: '#64748B',
        },
      },
      borderRadius: {
        card: '18px',
        button: '14px',
        input: '14px',
        badge: '9999px',
      },
      boxShadow: {
        card: '0px 4px 12px rgba(16, 24, 40, 0.06)',
        hover: '0px 8px 24px rgba(16, 24, 40, 0.10)',
      },
    },
  },
  plugins: [],
};

