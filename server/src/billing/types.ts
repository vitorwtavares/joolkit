// The installed stripe SDK does not re-export its resource types through the
// package entry (only the client instance type is reachable). We model the
// minimal shapes we actually consume and cast at the Stripe boundary — webhook
// payloads and `retrieve` results.

export interface StripePriceLike {
  id: string
  recurring: { interval: string; interval_count: number } | null
}

export interface StripeSubscriptionLike {
  id: string
  customer: string | { id: string }
  status: string
  currency: string
  cancel_at_period_end: boolean
  items: {
    data: Array<{
      current_period_end: number | null
      price: StripePriceLike | null
    }>
  }
}

export interface StripeEventLike {
  id: string
  type: string
  data: { object: unknown }
}

export interface StripeCustomerLike {
  deleted?: boolean
  metadata?: Record<string, string>
}
