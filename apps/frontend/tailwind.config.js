/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
      extend: {
          colors: {
            // FWC Brand Colors - Light Theme
            primary: {
              50: '#E6F2FF',
              100: '#CCE0F5',
              200: '#99C2EA',
              300: '#66A3E0',
              400: '#3385D6',
              500: '#0066CC',
              600: '#0066CC',
              700: '#005299',
              800: '#004080',
              900: '#003366',
            },
          accent: {
            50: '#E6F7FF',
            100: '#B3E5FC',
            200: '#80D3F9',
            300: '#4DC1F6',
            400: '#1AAFF3',
            500: '#00B4D8',
            600: '#0099BC',
            700: '#007EA0',
            800: '#006384',
            900: '#004868',
          },
          yellow: {
            50: '#FFFDF0',
            100: '#FFFBE0',
            200: '#FFF7C1',
            300: '#FFF3A2',
            400: '#FFEF83',
            500: '#FFD60A',
            600: '#CCAB08',
            700: '#998006',
            800: '#665604',
            900: '#332B02',
          },
          // Neutral Colors
          gray: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          },
          // Semantic Colors
          success: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            300: '#86EFAC',
            400: '#4ADE80',
            500: '#22C55E',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#14532D',
          },
          warning: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
          },
          error: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
          },
        },
        fontFamily: {
          heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
          body: ['Inter', 'Lato', 'system-ui', 'sans-serif'],
          sans: ['Inter', 'system-ui', 'sans-serif'],
        },
        borderRadius: {
          '4xl': '2rem',
          '5xl': '2.5rem',
        },
        boxShadow: {
          'fwc': '0 10px 30px rgba(3, 12, 30, 0.08)',
          'fwc-lg': '0 20px 60px rgba(3, 12, 30, 0.12)',
          'fwc-xl': '0 25px 80px rgba(3, 12, 30, 0.16)',
          'inner-lg': 'inset 0 10px 20px rgba(0, 0, 0, 0.1)',
        },
          backgroundImage: {
            'gradient-primary': 'linear-gradient(90deg, #003366 0%, #00B4D8 100%)',
            'gradient-accent': 'linear-gradient(135deg, #00B4D8 0%, #0066CC 100%)',
            'gradient-hero': 'linear-gradient(135deg, #003366 0%, #0066CC 50%, #00B4D8 100%)',
            'gradient-magic': 'linear-gradient(135deg, #003366 0%, #0066CC 50%, #00B4D8 100%)',
            'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
          },
        animation: {
          'fade-in': 'fadeIn 0.6s ease-out',
          'slide-up': 'slideUp 0.6s ease-out',
          'scale-in': 'scaleIn 0.4s ease-out',
          'float': 'float 6s ease-in-out infinite',
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'bounce-slow': 'bounce 2s infinite',
          'twinkle': 'twinkle 2s ease-in-out infinite',
          'glow': 'glow 2s ease-in-out infinite alternate',
          'magic-pulse': 'magicPulse 3s ease-in-out infinite',
          'sparkle': 'sparkle 1.5s ease-in-out infinite',
          'wave': 'wave 4s ease-in-out infinite',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { opacity: '0', transform: 'translateY(20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          scaleIn: {
            '0%': { opacity: '0', transform: 'scale(0.95)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          twinkle: {
            '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
            '50%': { opacity: '1', transform: 'scale(1.2)' },
          },
          glow: {
            '0%': { boxShadow: '0 0 20px rgba(65, 105, 225, 0.3)' },
            '100%': { boxShadow: '0 0 40px rgba(65, 105, 225, 0.8)' },
          },
          magicPulse: {
            '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
            '50%': { transform: 'scale(1.1)', opacity: '1' },
          },
          sparkle: {
            '0%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
            '50%': { opacity: '1', transform: 'scale(1) rotate(180deg)' },
          },
          wave: {
            '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
            '25%': { transform: 'translateX(10px) rotate(1deg)' },
            '75%': { transform: 'translateX(-10px) rotate(-1deg)' },
          },
        },
        backdropBlur: {
          'xs': '2px',
        },
        // Responsive design utilities
        container: {
          center: true,
          padding: {
            DEFAULT: '1rem',
            sm: '1.5rem',
            lg: '2rem',
            xl: '2.5rem',
            '2xl': '3rem',
          },
          screens: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px',
          },
        },
        // Responsive spacing
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
          '128': '32rem',
          // Mobile-first spacing
          'mobile': '1rem',
          'tablet': '1.5rem',
          'desktop': '2rem',
        },
        // Responsive typography
        fontSize: {
          'xs': ['0.75rem', { lineHeight: '1rem' }],
          'sm': ['0.875rem', { lineHeight: '1.25rem' }],
          'base': ['1rem', { lineHeight: '1.5rem' }],
          'lg': ['1.125rem', { lineHeight: '1.75rem' }],
          'xl': ['1.25rem', { lineHeight: '1.75rem' }],
          '2xl': ['1.5rem', { lineHeight: '2rem' }],
          '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
          '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
          '5xl': ['3rem', { lineHeight: '1' }],
          '6xl': ['3.75rem', { lineHeight: '1' }],
          '7xl': ['4.5rem', { lineHeight: '1' }],
          '8xl': ['6rem', { lineHeight: '1' }],
          '9xl': ['8rem', { lineHeight: '1' }],
          // Responsive display sizes
          'display': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
          'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
          'h2': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
          'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
          'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
          'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
          'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
          'small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        },
        screens: {
          // Mobile-first breakpoints
          'xs': '320px',      // Extra small phones
          'sm': '640px',      // Small phones
          'md': '768px',      // Tablets
          'lg': '1024px',     // Small laptops
          'xl': '1280px',     // Large laptops
          '2xl': '1536px',    // Desktops
          '3xl': '1920px',    // Large desktops
          
          // Custom breakpoints for better responsive design
          'mobile': '320px',
          'mobile-lg': '375px',
          'mobile-xl': '414px',
          'tablet': '768px',
          'tablet-lg': '1024px',
          'desktop': '1280px',
          'desktop-lg': '1440px',
          'desktop-xl': '1920px',
          
          // Container breakpoints
          'container-sm': '640px',
          'container-md': '768px',
          'container-lg': '1024px',
          'container-xl': '1280px',
          'container-2xl': '1536px',
        },
      },
  },
  plugins: [
    // Add responsive design utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Responsive text utilities
        '.text-responsive-xs': {
          fontSize: theme('fontSize.xs[0]'),
          lineHeight: theme('fontSize.xs[1].lineHeight'),
        },
        '.text-responsive-sm': {
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
        },
        '.text-responsive-base': {
          fontSize: theme('fontSize.base[0]'),
          lineHeight: theme('fontSize.base[1].lineHeight'),
        },
        '.text-responsive-lg': {
          fontSize: theme('fontSize.lg[0]'),
          lineHeight: theme('fontSize.lg[1].lineHeight'),
        },
        '.text-responsive-xl': {
          fontSize: theme('fontSize.xl[0]'),
          lineHeight: theme('fontSize.xl[1].lineHeight'),
        },
        
        // Responsive spacing utilities
        '.p-responsive': {
          padding: theme('spacing.mobile'),
          '@media (min-width: 768px)': {
            padding: theme('spacing.tablet'),
          },
          '@media (min-width: 1024px)': {
            padding: theme('spacing.desktop'),
          },
        },
        '.m-responsive': {
          margin: theme('spacing.mobile'),
          '@media (min-width: 768px)': {
            margin: theme('spacing.tablet'),
          },
          '@media (min-width: 1024px)': {
            margin: theme('spacing.desktop'),
          },
        },
        
        // Responsive grid utilities
        '.grid-responsive': {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: theme('spacing.4'),
          '@media (min-width: 640px)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: theme('spacing.6'),
          },
          '@media (min-width: 1024px)': {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: theme('spacing.8'),
          },
        },
        
        // Responsive flex utilities
        '.flex-responsive': {
          display: 'flex',
          flexDirection: 'column',
          gap: theme('spacing.4'),
          '@media (min-width: 768px)': {
            flexDirection: 'row',
            gap: theme('spacing.6'),
          },
        },
        
        // Mobile-first container
        '.container-responsive': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@media (min-width: 640px)': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@media (min-width: 1024px)': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
          '@media (min-width: 1280px)': {
            maxWidth: '1280px',
          },
        },
        
        // Responsive visibility utilities
        '.mobile-only': {
          display: 'block',
          '@media (min-width: 768px)': {
            display: 'none',
          },
        },
        '.tablet-up': {
          display: 'none',
          '@media (min-width: 768px)': {
            display: 'block',
          },
        },
        '.desktop-up': {
          display: 'none',
          '@media (min-width: 1024px)': {
            display: 'block',
          },
        },
        
        // Touch-friendly button sizes
        '.btn-touch': {
          minHeight: '44px',
          minWidth: '44px',
          padding: theme('spacing.3'),
          '@media (min-width: 768px)': {
            minHeight: '40px',
            minWidth: '40px',
            padding: theme('spacing.2'),
          },
        },
        
        // Responsive card utilities
        '.card-responsive': {
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.4'),
          boxShadow: theme('boxShadow.sm'),
          '@media (min-width: 768px)': {
            padding: theme('spacing.6'),
            boxShadow: theme('boxShadow.md'),
          },
          '@media (min-width: 1024px)': {
            padding: theme('spacing.8'),
            boxShadow: theme('boxShadow.lg'),
          },
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
}
