import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LimitBadgeProps {
  used: number
  limit: number
  isLoading?: boolean
  atLimit?: boolean
  className?: string
}

export function LimitBadge({
  used,
  limit,
  isLoading = false,
  atLimit = false,
  className,
}: LimitBadgeProps) {
  if (isLoading) {
    return <Skeleton className="h-[18px] w-12 rounded-full" />
  }

  return (
    <div
      className={cn(
        'rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] leading-none text-muted-foreground',
        atLimit && 'border-brand-border bg-brand-soft text-brand',
        className,
      )}
    >
      {used}/{limit}
    </div>
  )
}
