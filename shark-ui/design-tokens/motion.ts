export const motion = {
  duration: {
    instant:  '50ms',
    fast:     '150ms',
    base:     '200ms',
    slow:     '300ms',
    slower:   '500ms',
    slowest:  '800ms',
  },
  easing: {
    linear:  'linear',
    ease:    'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn:  'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
    snappy:  'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  variants: {
    fadeUp: {
      hidden:  { opacity: 0, y: 16 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    },
    fadeIn: {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    },
    slideInLeft: {
      hidden:  { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    },
    scaleIn: {
      hidden:  { opacity: 0, scale: 0.92 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] } },
    },
    staggerChildren: {
      visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
    },
  },
} as const
