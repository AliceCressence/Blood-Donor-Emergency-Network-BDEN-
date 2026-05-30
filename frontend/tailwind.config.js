/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      // ─── FONTS ────────────────────────────────────────────────────
      fontFamily: {
        display: ['Syne', 'sans-serif'],        // headings, hero text
        body:    ['DM Sans', 'sans-serif'],     // all body copy
        mono:    ['JetBrains Mono', 'monospace'], // data, blood type labels
      },

      // ─── COLORS ───────────────────────────────────────────────────
      colors: {

        // Primary — blood red (brand identity)
        blood: {
          50:  '#FFF1F1',
          100: '#FFE0E0',
          200: '#FFC5C5',
          300: '#FF9B9B',
          400: '#FF6161',
          500: '#F83030',  // ← primary brand red
          600: '#E51111',
          700: '#C20A0A',
          800: '#A10D0D',
          900: '#851212',
          950: '#490404',
        },

        // Warm neutral — parchment/skin tones (backgrounds, cards)
        warm: {
          50:  '#FAFAF8',
          100: '#F4F3EF',
          200: '#E8E7E1',
          300: '#D5D3CA',
          400: '#B5B2A5',
          500: '#9B9889',
          600: '#7F7C6E',
          700: '#666358',
          800: '#514E45',
          900: '#3A3831',
          950: '#1E1D18',
        },

        // Amber — urgency, warnings, highlights
        amber: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',  // ← amber accent
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },

        // Teal — success, verified, health indicators
        teal: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',  // ← teal accent
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },

        // Blue — informational, hospital-related
        blue: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',  // ← blue accent
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // Semantic aliases for convenience
        emergency: '#E51111',    // blood-600
        verified:  '#0D9488',    // teal-600
        pending:   '#D97706',    // amber-600
        info:      '#2563EB',    // blue-600
      },

      // ─── SPACING ──────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ─── BORDER RADIUS ───────────────────────────────────────────
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },

      // ─── SHADOWS ──────────────────────────────────────────────────
      boxShadow: {
        'card':      '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
        'card-hover':'0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)',
        'emergency': '0 4px 20px rgba(229,17,17,0.25)',
        'inner-sm':  'inset 0 1px 3px rgba(0,0,0,0.08)',
      },

      // ─── TYPOGRAPHY ───────────────────────────────────────────────
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.375rem' }],
        'base': ['1rem',     { lineHeight: '1.6rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.7rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.75rem' }],
        '5xl':  ['3rem',     { lineHeight: '3.5rem' }],
        '6xl':  ['3.75rem',  { lineHeight: '4.25rem' }],
        '7xl':  ['4.5rem',   { lineHeight: '5rem' }],
      },

      // ─── ANIMATION ────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(229,17,17,0.4)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(229,17,17,0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.35s ease-out both',
        'fade-in-fast':   'fade-in-fast 0.2s ease-out both',
        'pulse-red':      'pulse-red 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out both',
      },

      // ─── SCREENS ─────────────────────────────────────────────────
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
