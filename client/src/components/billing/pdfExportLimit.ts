import { PLAN_LIMITS } from '@joolkit/billing/plans'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchBillingStatus, type PdfExportUsage } from '@/api/hooks/useBilling'

export function pdfExportUpgradeReason(freeLimit: number): string {
  const proLimit = PLAN_LIMITS.pro.pdfExportsPerDay
  return `You've used your Free plan limit of ${freeLimit} PDF exports per day. Upgrade to Pro for ${proLimit} exports a day.`
}

export function handlePdfExportLimitReached(opts: {
  isPro: boolean
  pdfExports: PdfExportUsage | undefined
  openUpgrade: (reason?: string) => void
}): void {
  if (opts.isPro) {
    toast.error('Daily PDF export limit reached. Try again tomorrow.')
  } else if (opts.pdfExports) {
    opts.openUpgrade(pdfExportUpgradeReason(opts.pdfExports.limit))
  }
}

// Refetches billing, then opens the upgrade modal (or Pro toast) when the daily
// PDF cap is spent. Returns true when the export should not proceed.
export async function blockPdfExportIfLimited(opts: {
  queryClient: QueryClient
  userId: string
  openUpgrade: (reason?: string) => void
}): Promise<boolean> {
  const status = await fetchBillingStatus(opts.queryClient, opts.userId)
  if (status.pdfExports.remaining > 0) return false
  handlePdfExportLimitReached({
    isPro: status.plan === 'pro',
    pdfExports: status.pdfExports,
    openUpgrade: opts.openUpgrade,
  })
  return true
}
