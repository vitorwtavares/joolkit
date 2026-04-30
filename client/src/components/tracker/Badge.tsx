import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  bg: string
  color?: string
  className?: string
}

export function Badge({
  children,
  bg,
  color = 'var(--foreground)',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-[1px] text-[14px] font-medium whitespace-nowrap',
        className,
      )}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  )
}
