import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  useBillingStatus,
  useCheckout,
  type BillingInterval,
} from '@/api/hooks/useBilling'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import { PRO_FEATURES, PRO_PRICING } from './planData'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Context-specific line shown above the plan (e.g. why the limit was hit).
  reason?: string
}

export function UpgradeDialog({
  open,
  onOpenChange,
  reason,
}: UpgradeDialogProps) {
  const [interval, setInterval] = useState<BillingInterval>('quarterly')
  const checkout = useCheckout()
  const { data: billing } = useBillingStatus()
  const currency = billing?.displayCurrency ?? 'usd'
  const pricing = PRO_PRICING[currency][interval]
  const quarterlyBadge = PRO_PRICING[currency].quarterly.badge

  async function handleUpgrade() {
    try {
      await checkout.mutateAsync(interval)
      // On success the browser is redirected to Stripe, so nothing else runs.
    } catch {
      toast.error('Could not start checkout. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles size={16} className="text-brand" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            {reason ??
              'Unlock the full toolkit for an active, organized search.'}
          </DialogDescription>
        </DialogHeader>

        <SegmentedToggle
          fullWidth
          value={interval}
          onChange={setInterval}
          options={[
            { label: 'Monthly', value: 'monthly' },
            {
              label: (
                <>
                  Quarterly ·
                  {quarterlyBadge && (
                    <span className="ml-1 font-medium text-brand">
                      {quarterlyBadge}
                    </span>
                  )}
                </>
              ),
              value: 'quarterly',
            },
          ]}
        />

        <div className="rounded-xl border border-border bg-secondary/50 p-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-foreground">
              {pricing.amount}
            </span>
            <span className="text-sm text-muted-foreground">{pricing.per}</span>
            {interval === 'quarterly' && (
              <span className="ml-1 self-center rounded-[6px] bg-brand px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-brand-foreground uppercase">
                Best price
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-text-faint">{pricing.sub}</p>

          <ul className="mt-4 flex flex-col gap-2">
            {PRO_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-[13px] text-foreground"
              >
                <Check size={15} className="shrink-0 text-brand" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleUpgrade} disabled={checkout.isPending}>
            {checkout.isPending ? 'Starting checkout…' : 'Get Pro'}
          </Button>
          <p className="text-center text-[11px] text-text-faint">
            Cancel anytime. Your final currency is confirmed at checkout.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
