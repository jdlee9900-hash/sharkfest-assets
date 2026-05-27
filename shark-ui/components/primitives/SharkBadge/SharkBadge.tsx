import { cn } from '@/utils'

export type BadgeVariant =
  | 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  | 'area-a' | 'area-b' | 'area-c'
  | 'cat-music' | 'cat-dj' | 'cat-rugby' | 'cat-food' | 'cat-bar'
  | 'cat-wellness' | 'cat-kids' | 'cat-general'
  | 'live' | 'soon' | 'past'

export type BadgeSize = 'sm' | 'md'

export interface SharkBadgeProps {
  /** Visual style */
  variant?: BadgeVariant
  /** Size preset */
  size?: BadgeSize
  /** Show a coloured dot before the label */
  dot?: boolean
  /** Animate the dot (for LIVE badges) */
  pulse?: boolean
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default:      { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
  brand:        { bg: '#fef3c7', text: '#92400e', dot: '#fbbf24' },
  success:      { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  warning:      { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  danger:       { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  info:         { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  'area-a':     { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  'area-b':     { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  'area-c':     { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  'cat-music':  { bg: '#ede9fe', text: '#6d28d9', dot: '#7c3aed' },
  'cat-dj':     { bg: '#dbeafe', text: '#1d4ed8', dot: '#2563eb' },
  'cat-rugby':  { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  'cat-food':   { bg: '#ffedd5', text: '#c2410c', dot: '#ea580c' },
  'cat-bar':    { bg: '#fef3c7', text: '#b45309', dot: '#d97706' },
  'cat-wellness':{ bg: '#cffafe', text: '#0e7490', dot: '#06b6d4' },
  'cat-kids':   { bg: '#fce7f3', text: '#be185d', dot: '#db2777' },
  'cat-general':{ bg: '#f1f5f9', text: '#475569', dot: '#64748b' },
  live:         { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  soon:         { bg: '#fef3c7', text: '#92400e', dot: '#fbbf24' },
  past:         { bg: '#f1f5f9', text: '#94a3b8', dot: '#cbd5e1' },
}

export function SharkBadge({ variant = 'default', size = 'md', dot, pulse, children, className }: SharkBadgeProps) {
  const styles = variantStyles[variant]
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5'

  return (
    <span
      className={cn(
        'inline-flex items-center font-body font-medium rounded-full leading-none',
        sizeClass,
        className,
      )}
      style={{ backgroundColor: styles.bg, color: styles.text }}
    >
      {(dot || pulse) && (
        <span
          className={cn('rounded-full flex-none', pulse && 'animate-[blink_1.4s_ease_infinite]')}
          style={{
            width: size === 'sm' ? 6 : 7,
            height: size === 'sm' ? 6 : 7,
            backgroundColor: styles.dot,
          }}
        />
      )}
      {children}
    </span>
  )
}
