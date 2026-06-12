import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateOrUpgradeButtonProps {
  atLimit: boolean
  isPro: boolean
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
  createLabel,
  upgradeLabel = 'Upgrade',
  onCreate,
  onUpgrade,
  disabled,
  size,
  className,
}: CreateOrUpgradeButtonProps) {
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
