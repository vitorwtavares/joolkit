import { Loader2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CoverLetterActionButtonProps {
  /** `panel` renders a full-width stacked button; `toolbar` renders a compact
   *  button that collapses to icon-only on smaller screens. */
  layout: 'panel' | 'toolbar'
  icon: LucideIcon
  /** Full label shown in the panel layout (may include the variation name). */
  label: string
  /** Short label shown in the toolbar layout and used as its accessible name. */
  compactLabel: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'default' | 'outline'
  /** Panel only: truncate long labels (used for the variation-named actions). */
  truncate?: boolean
}

export function CoverLetterActionButton({
  layout,
  icon: Icon,
  label,
  compactLabel,
  onClick,
  loading = false,
  disabled = false,
  variant = 'default',
  truncate = false,
}: CoverLetterActionButtonProps) {
  const iconEl = loading ? (
    <Loader2 className="size-3.5 animate-spin" />
  ) : (
    <Icon className="size-3.5" />
  )

  if (layout === 'toolbar') {
    return (
      <Button
        variant={variant}
        size="sm"
        aria-label={compactLabel}
        title={compactLabel}
        onClick={onClick}
        disabled={disabled}
        className="cursor-pointer max-[1149px]:size-8 max-[1149px]:px-0"
      >
        {iconEl}
        <span className="hidden min-[1150px]:inline">{compactLabel}</span>
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-[34px] w-full cursor-pointer',
        truncate && 'min-w-0 overflow-hidden px-6',
      )}
    >
      {iconEl}
      {truncate ? <span className="min-w-0 truncate">{label}</span> : label}
    </Button>
  )
}
