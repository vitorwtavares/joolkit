import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CreateOrUpgradeButtonProps {
  atLimit: boolean
  isPro: boolean
  isLoading?: boolean
  createLabel: string
  upgradeLabel?: string
  onCreate: () => void
  onUpgrade: () => void
  // Extra disable condition (e.g. a create mutation in flight).
  disabled?: boolean
  size?: React.ComponentProps<typeof Button>['size']
  className?: string
}

// The solid primary action on capped pages: a normal "create" button that flips
// to an "upgrade" CTA for Free users at the cap, and disables for Pro users who
// have hit the hard ceiling (nothing to upgrade to).
export function CreateOrUpgradeButton({
  atLimit,
  isPro,
  isLoading = false,
  createLabel,
  upgradeLabel = 'Upgrade',
  onCreate,
  onUpgrade,
  disabled,
  size,
  className,
}: CreateOrUpgradeButtonProps) {
  if (isLoading) {
    return <Skeleton className={cn('h-9 w-28 rounded-md', className)} />
  }

  const showUpgrade = atLimit && !isPro
  return (
    <Button
      size={size}
      className={className}
      disabled={disabled || (atLimit && isPro)}
      onClick={showUpgrade ? onUpgrade : onCreate}
    >
      {showUpgrade ? (
        <>
          <Sparkles size={14} />
          {upgradeLabel}
        </>
      ) : (
        <>
          <Plus size={14} />
          {createLabel}
        </>
      )}
    </Button>
  )
}
