export const fonts = {
  display: ['Bebas Neue', 'system-ui', 'sans-serif'],
  body:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  accent:  ['Playfair Display', 'Georgia', 'serif'],
  mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
} as const

export const typeScale = {
  'display-2xl': { size: '8rem',    leading: '0.88', tracking: '-0.01em' },
  'display-xl':  { size: '5rem',    leading: '0.90', tracking: '-0.01em' },
  'display-lg':  { size: '3.5rem',  leading: '0.92', tracking: '0' },
  'display-md':  { size: '2.5rem',  leading: '0.95', tracking: '0.02em' },
  'display-sm':  { size: '1.5rem',  leading: '1.0',  tracking: '0.06em' },
  'display-xs':  { size: '0.75rem', leading: '1.0',  tracking: '0.25em' },
  'body-xl':     { size: '1.25rem',  leading: '1.75', weight: '400' },
  'body-lg':     { size: '1.125rem', leading: '1.7',  weight: '400' },
  'body-md':     { size: '1rem',     leading: '1.65', weight: '400' },
  'body-sm':     { size: '0.875rem', leading: '1.6',  weight: '400' },
  'body-xs':     { size: '0.75rem',  leading: '1.5',  weight: '500' },
  'accent-lg':   { size: '1.5rem',   leading: '1.3',  style: 'italic', weight: '700' },
  'accent-md':   { size: '1.125rem', leading: '1.4',  style: 'italic', weight: '600' },
  'accent-sm':   { size: '0.9rem',   leading: '1.4',  style: 'italic', weight: '600' },
} as const
