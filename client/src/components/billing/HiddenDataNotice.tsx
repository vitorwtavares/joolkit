import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CappedResource } from '@/api/hooks/useBilling'
import { Button } from '@/components/ui/button'
import { useUpgrade } from './UpgradeProvider'
import { RESOURCE_NOUNS } from './planData'

interface HiddenDataNoticeProps {
  // Single-resource mode: builds the standard sentence and no-ops when nothing
  // is hidden. `limit` is null only for unlimited (Pro) resources, which never
  // have hidden rows.
  resource?: CappedResource
  limit?: number | null
  hidden?: number
  // Custom mode: render this body instead (e.g. one banner covering several
  // resources). The caller controls when it renders.
  message?: ReactNode
  className?: string
}

// Trust-preserving banner shown to downgraded users on capped pages: their Pro
// data is preserved, Free just hides the overflow until they resubscribe.
export function HiddenDataNotice({
  resource,
  limit,
  hidden,
  message,
  className,
}: HiddenDataNoticeProps) {
  const { openUpgrade } = useUpgrade()

  let body: ReactNode = message
  if (!body) {
    if (!resource || limit == null || !hidden || hidden <= 0) return null
    const { plural } = RESOURCE_NOUNS[resource]
    body = (
      <>
        Your Pro data is safely saved. Free shows your {limit} most recent{' '}
        {plural} — {hidden} more {hidden === 1 ? 'is' : 'are'} hidden.{' '}
        <span className="font-medium text-foreground">
          Upgrade to Pro to unlock all.
        </span>
      </>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-secondary/60 px-4 py-3',
        className,
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
        <Lock size={14} />
      </span>
      <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">{body}</p>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => openUpgrade()}
      >
        Upgrade
      </Button>
    </div>
  )
}
