import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan: '#42f5ff',
          glow: '#1de9ff',
          dark: '#05060a'
        }
      },
      boxShadow: {
        neon: '0 0 20px rgba(66,245,255,0.35), 0 0 60px rgba(66,245,255,0.2)'
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' }
        }
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        scan: 'scan 12s linear infinite'
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
