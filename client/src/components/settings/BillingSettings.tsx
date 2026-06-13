import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Sparkles } from 'lucide-react'
import {
  useBillingPortal,
  useBillingStatus,
  type BillingStatus,
  type CappedResource,
} from '@/api/hooks/useBilling'
import { useUpgrade } from '@/components/billing/UpgradeProvider'
import { RESOURCE_NOUNS } from '@/components/billing/planData'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

const USAGE_ROWS: CappedResource[] = [
  'applications',
  'answers',
  'coverLetterVariations',
  'resumeVariations',
  'tokenDefinitions',
]

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function totalHidden(hidden: BillingStatus['hidden']): number {
  return Object.values(hidden).reduce((sum, n) => sum + n, 0)
}

export function BillingSettings() {
  const { data: status, isLoading } = useBillingStatus()
  const { openUpgrade } = useUpgrade()
  const portal = useBillingPortal()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [confirmPortalOpen, setConfirmPortalOpen] = useState(false)

  // Surface the Stripe redirect outcome, then drop the query param so a refresh
  // doesn't re-toast. Success refetches status (the webhook may have just landed).
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (!checkout) return
    if (checkout === 'success') {
      toast.success('Welcome to Pro! Your plan is now active.')
      queryClient.invalidateQueries({ queryKey: ['billing'] })
    } else if (checkout === 'cancelled') {
      toast.info('Checkout cancelled — no changes were made.')
    }
    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, queryClient])

  async function handleManageBilling() {
    // Keep the dialog open so its confirm button shows the in-flight spinner
    // while we fetch the portal URL; the browser redirects on success.
    try {
      await portal.mutateAsync()
    } catch {
      setConfirmPortalOpen(false)
      toast.error('Could not open the billing portal. Please try again.')
    }
  }

  if (isLoading || !status) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  const isPro = status.plan === 'pro'
  const sub = status.subscription
  const hiddenCount = totalHidden(status.hidden)

  let renewalLine = ''
  if (isPro && sub) {
    if (sub.cancel_at_period_end) {
      renewalLine = `Your plan ends on ${formatDate(sub.current_period_end)} — you'll move to Free then.`
    } else if (sub.current_period_end) {
      renewalLine = `Renews on ${formatDate(sub.current_period_end)}.`
    }
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold tracking-tight">Billing</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Manage your plan and see how much of it you're using.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {isPro ? 'Pro' : 'Free'} plan
              </span>
              {isPro && (
                <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
                  <Sparkles size={11} />
                  Active
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {isPro
                ? renewalLine || 'Your Pro plan is active.'
                : 'Upgrade to unlock the full toolkit for an active search.'}
            </p>
          </div>
          <div className="shrink-0">
            {isPro ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmPortalOpen(true)}
                disabled={portal.isPending}
              >
                Manage billing
              </Button>
            ) : (
              <Button size="sm" onClick={() => openUpgrade()}>
                <Sparkles size={14} />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>

        {hiddenCount > 0 && (
          <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-[12px] text-muted-foreground">
            {hiddenCount} {hiddenCount === 1 ? 'item' : 'items'} from your
            previous Pro plan {hiddenCount === 1 ? 'is' : 'are'} safely stored.
            Resubscribe to restore {hiddenCount === 1 ? 'it' : 'them'}{' '}
            instantly.
          </p>
        )}
      </div>

      <h3 className="mt-6 mb-2 text-[12px] font-medium tracking-[0.07em] text-text-faint uppercase">
        Usage
      </h3>
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card px-4">
        {USAGE_ROWS.map((resource) => {
          const used = status.usage[resource]
          const limit = status.limits[resource]
          const atLimit = limit !== null && used >= limit
          return (
            <div
              key={resource}
              className="flex items-center justify-between py-3"
            >
              <span className="text-[13px] text-foreground capitalize">
                {RESOURCE_NOUNS[resource].plural}
              </span>
              <span
                className={cn(
                  'font-mono text-[12px] text-muted-foreground',
                  atLimit && 'text-destructive',
                )}
              >
                {used} / {limit === null ? '∞' : limit}
              </span>
            </div>
          )
        })}
        <div className="flex items-center justify-between py-3">
          <span className="text-[13px] text-foreground">
            PDF exports (daily limit)
          </span>
          <span
            className={cn(
              'font-mono text-[12px] text-muted-foreground',
              status.pdfExports.remaining <= 0 && 'text-destructive',
            )}
          >
            {status.pdfExports.used} / {status.pdfExports.limit}
          </span>
        </div>
      </div>

      {!isPro && (
        <div className="mt-4 flex items-center gap-2 text-[12px] text-text-faint">
          <Check size={13} className="text-brand" />
          No card required on Free. Upgrade any time.
        </div>
      )}

      <ConfirmDialog
        open={confirmPortalOpen}
        onOpenChange={setConfirmPortalOpen}
        title="Manage your billing"
        description="You'll be taken to Stripe to update or cancel your plan. If you cancel, you keep Pro until the end of your paid period — after that, Free limits apply and any over-limit data stays safely stored, ready to restore if you resubscribe."
        confirmLabel="Continue to Stripe"
        confirmingLabel="Redirecting to Stripe…"
        confirmVariant="default"
        isConfirming={portal.isPending}
        onConfirm={handleManageBilling}
      />
    </div>
  )
}
