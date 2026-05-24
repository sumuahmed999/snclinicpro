/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 Primary Colors - Dark Teals
        primary: {
          50: '#e6f2f3',
          100: '#cce5e7',
          200: '#99cbcf',
          300: '#66b1b7',
          400: '#33979f',
          500: '#042126', // Dark Teal (Main color)
          600: '#031a1e',
          700: '#021417',
          800: '#020d0f',
          900: '#010708',
          DEFAULT: '#042126',
        },
        secondary: {
          50: '#f5f7f2',
          100: '#ebefe5',
          200: '#d7dfcb',
          300: '#c3cfb1',
          400: '#afbf97',
          500: '#294142', // Deep Greenish Teal
          600: '#213435',
          700: '#192728',
          800: '#101a1a',
          900: '#080d0d',
          DEFAULT: '#294142',
        },
        
        // 🎨 Secondary Colors - Backgrounds
        beige: {
          50: '#fafbf8',
          100: '#f5f7f1',
          200: '#ebefe3',
          300: '#e1e7d5',
          400: '#d7dfc7',
          500: '#D5DAC6', // Soft Beige (Section BG)
          600: '#aab09e',
          700: '#808577',
          800: '#555a4f',
          900: '#2b2d28',
          DEFAULT: '#D5DAC6',
        },
        cream: {
          50: '#fefef9',
          100: '#fdfdf3',
          200: '#fbfbe7',
          300: '#f9f9db',
          400: '#f7f7cf',
          500: '#F2F2DC', // Light Cream
          600: '#c2c2b0',
          700: '#919184',
          800: '#616158',
          900: '#30302c',
          DEFAULT: '#F2F2DC',
        },
        
        // 🎨 Neutral / Text Colors
        sage: {
          50: '#f4f6f5',
          100: '#e9edeb',
          200: '#d3dbd7',
          300: '#bdc9c3',
          400: '#a7b7af',
          500: '#899893', // Muted Gray-Green
          600: '#6e7a76',
          700: '#525b58',
          800: '#373d3b',
          900: '#1b1e1d',
          DEFAULT: '#899893',
        },
        charcoal: {
          50: '#f2f3f2',
          100: '#e5e7e5',
          200: '#cbcfcb',
          300: '#b1b7b1',
          400: '#979f97',
          500: '#5C655E', // Dark Gray
          600: '#4a514b',
          700: '#373d38',
          800: '#252826',
          900: '#121413',
          DEFAULT: '#5C655E',
        },
        teal: {
          muted: '#5526C6', // Additional teal shade from palette
        },
        
        // 🎨 Accent Colors
        gold: {
          50: '#f7f4f0',
          100: '#efe9e1',
          200: '#dfd3c3',
          300: '#cfbda5',
          400: '#bfa787',
          500: '#A88E6D', // Warm Gold / Skin Tone Accent
          600: '#877257',
          700: '#655541',
          800: '#44392c',
          900: '#221c16',
          DEFAULT: '#A88E6D',
        },
        olive: {
          50: '#f5f6f2',
          100: '#ebede5',
          200: '#d7dbcb',
          300: '#c3c9b1',
          400: '#afb797',
          500: '#9BA57D', // Soft Olive Tint
          600: '#7c8464',
          700: '#5d634b',
          800: '#3e4232',
          900: '#1f2119',
          DEFAULT: '#9BA57D',
        },
      },
      boxShadow: {
        'soft': '0 2px 20px -5px rgba(4, 33, 38, 0.1)',
        'card': '0 4px 20px -2px rgba(4, 33, 38, 0.08)',
        'card-hover': '0 8px 30px -5px rgba(4, 33, 38, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(4, 33, 38, 0.06)',
        'glow': '0 0 20px rgba(168, 142, 109, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #042126 0%, #294142 100%)',
        'gradient-accent': 'linear-gradient(135deg, #A88E6D 0%, #9BA57D 100%)',
        'gradient-soft': 'linear-gradient(180deg, #F2F2DC 0%, #D5DAC6 100%)',
        'mesh-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23042126' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


