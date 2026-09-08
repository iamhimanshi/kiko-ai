/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core — design brief section 3
        base: '#080B16',        // bg-primary
        surface: '#0E1324',     // bg-secondary (sidebar/sections)
        card: '#151B2E',        // surface (cards)
        cardElevated: '#1B2238',// surface-elevated (modals/dropdowns)
        surfaceAlt: '#151B2E',  // back-compat alias -> same as `card`
        border: '#29324A',
        ink: '#F5F7FF',
        muted: '#A7AEC2',
        subtle: '#6F7891',

        // Brand — indigo (KIKO actions)
        brand: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          dark: '#4F46E5',
          soft: '#20204A',
        },

        // Semantic — section 4 (deliberately not green-based)
        focus: '#22D3EE',      // focused / healthy — cyan
        warning: '#F59E0B',
        distract: '#F97316',   // actively distracted
        danger: '#EF4444',
        success: '#2DD4BF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '56px', fontWeight: '600' }],
        h1: ['36px', { lineHeight: '44px', fontWeight: '600' }],
        h2: ['28px', { lineHeight: '36px', fontWeight: '600' }],
        h3: ['22px', { lineHeight: '30px', fontWeight: '600' }],
        h4: ['18px', { lineHeight: '26px', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
        modal: '20px',
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.20)',
      },
    },
  },
  plugins: [],
}
