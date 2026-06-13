import { useCallback } from 'react'
import { useBillingStatus, type CappedResource } from '@/api/hooks/useBilling'
import { useUpgrade } from './UpgradeProvider'
import { FREE_CEILINGS } from './planData'

export interface ResourceLimit {
  isPro: boolean
  // Effective cap for the current plan (null = unlimited). Falls back to free
  // limits while billing status loads.
  limit: number | null
  // Rows archived by a downgrade, surfaced via hidden-data notices.
  hidden: number
  // `used` (the caller's live count) has reached the cap.
  atLimit: boolean
  // At the cap AND on Free — i.e. upgrading would actually lift it.
  canUpgrade: boolean
  // Always-callable: opens the upgrade dialog with default copy.
  openUpgrade: () => void
  // Undefined on Pro so presentational lists render a hard "max reached" state
  // instead of an upgrade CTA the user can't act on.
  onUpgrade: (() => void) | undefined
}

// Centralises the per-resource plan derivation every capped surface repeated:
// effective limit (with loading fallback), hidden count, at-limit/upgrade flags.
// `used` is the caller's source-of-truth count (its own optimistic list length).
export function useResourceLimit(
  resource: CappedResource,
  used: number,
): ResourceLimit {
  const { data } = useBillingStatus()
  const { openUpgrade } = useUpgrade()

  const isPro = data?.plan === 'pro'
  const limit = data ? data.limits[resource] : FREE_CEILINGS[resource]
  const hidden = data?.hidden[resource] ?? 0
  const atLimit = limit !== null && used >= limit
  const canUpgrade = atLimit && !isPro

  const triggerUpgrade = useCallback(() => openUpgrade(), [openUpgrade])

  return {
    isPro,
    limit,
    hidden,
    atLimit,
    canUpgrade,
    openUpgrade: triggerUpgrade,
    onUpgrade: isPro ? undefined : triggerUpgrade,
  }
}
