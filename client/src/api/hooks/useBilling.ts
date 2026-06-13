import { useMutation, useQuery, type QueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/auth'
import { api } from '../api'

export const billingQueryKey = ['billing'] as const

export function billingStatusQueryKey(userId: string) {
  return ['billing', 'status', userId] as const
}

export function invalidateBillingStatus(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: billingQueryKey })
}

export type Plan = 'free' | 'pro'
export type BillingInterval = 'monthly' | 'quarterly'
export type DisplayCurrency = 'usd' | 'brl'

// Stored-row caps the plan exposes. `tokenDefinitions` is null on Pro (unlimited).
export interface PlanLimits {
  applications: number
  answers: number
  resumeVariations: number
  coverLetterVariations: number
  tokenDefinitions: number | null
  pdfExportsPerDay: number
}

// Per-resource counts; keys line up with PlanLimits (minus pdfExportsPerDay,
// which is a daily rate, not a stored total).
export interface UsageCounts {
  applications: number
  answers: number
  resumeVariations: number
  coverLetterVariations: number
  tokenDefinitions: number
}

export type CappedResource = keyof UsageCounts

export interface PdfExportUsage {
  limit: number
  used: number
  remaining: number
  // ISO reset time for the daily window, or null if none used yet.
  resetAt: string | null
}

export interface BillingSubscription {
  status: string
  billing_interval: BillingInterval | null
  currency: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export interface BillingStatus {
  plan: Plan
  limits: PlanLimits
  // `usage` counts the active set; `hidden` counts rows archived by a downgrade.
  usage: UsageCounts
  hidden: UsageCounts
  // Today's daily PDF-export quota (a rate, not a stored count).
  pdfExports: PdfExportUsage
  // Best-effort currency for the pre-checkout UI (IP-based; Stripe finalises by
  // card country at checkout).
  displayCurrency: DisplayCurrency
  subscription: BillingSubscription | null
}

const BILLING_STATUS_STALE_TIME = 30 * 1000
const BILLING_STATUS_RETRY_COUNT = 3

export function fetchBillingStatus(
  queryClient: QueryClient,
  userId: string,
): Promise<BillingStatus> {
  return queryClient.fetchQuery({
    queryKey: billingStatusQueryKey(userId),
    queryFn: () => api.get<BillingStatus>('/api/billing/status'),
    staleTime: 0,
  })
}

export function useBillingStatus() {
  const { user } = useAuth()
  return useQuery({
    queryKey: billingStatusQueryKey(user?.id ?? ''),
    queryFn: () => api.get<BillingStatus>('/api/billing/status'),
    enabled: !!user,
    staleTime: BILLING_STATUS_STALE_TIME,
    refetchOnWindowFocus: true,
    retry: BILLING_STATUS_RETRY_COUNT,
  })
}

// Starts a Stripe Checkout session and hands the browser off to it. Already-Pro
// users are rejected server-side (409) and should manage via the portal instead.
export function useCheckout() {
  return useMutation({
    mutationFn: async (interval: BillingInterval) => {
      const { url } = await api.post<{ url: string }>('/api/billing/checkout', {
        interval,
      })
      window.location.href = url
    },
  })
}

// Opens the Stripe Customer Portal for managing or cancelling an existing plan.
export function useBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const { url } = await api.post<{ url: string }>('/api/billing/portal', {})
      window.location.href = url
    },
  })
}
