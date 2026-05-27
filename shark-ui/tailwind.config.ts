import type { Config } from 'tailwindcss'
import { colours, shadows, radius } from './design-tokens'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './stories/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: colours as Record<string, unknown>,
      fontFamily: {
        display: ['Bebas Neue', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        accent:  ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: shadows,
      borderRadius: radius,
      animation: {
        shimmer:     'shimmer 5s linear infinite',
        blink:       'blink 1.4s ease infinite',
        'spin-slow': 'spin 0.9s linear infinite',
        'flip-in':   'flipIn 0.35s ease-in-out',
        'now-glow':  'nowGlow 1.8s ease infinite',
        'draw-route':'drawRoute 3.5s 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '150% center' },
          '100%': { backgroundPosition: '-100% center' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.2' },
        },
        flipIn: {
          '0%':   { transform: 'rotateX(0deg)' },
          '50%':  { transform: 'rotateX(-90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        nowGlow: {
          '0%,100%': { boxShadow: '0 0 0 3px rgba(239,68,68,0.22)' },
          '50%':     { boxShadow: '0 0 0 6px rgba(239,68,68,0.08)' },
        },
        drawRoute: {
          to: { strokeDashoffset: '0' },
        },
      },
      screens: {
        xs:    '480px',
        sm:    '640px',
        md:    '768px',
        lg:    '1024px',
        xl:    '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [],
}

export default config
