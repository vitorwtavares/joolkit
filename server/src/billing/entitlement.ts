import { getSupabase } from '../middleware/auth'
import { PLAN_LIMITS, type Plan, type PlanLimits } from './plans'

export interface SubscriptionRow {
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  plan: string
  status: string | null
  billing_interval: string | null
  currency: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface Entitlement {
  plan: Plan
  limits: PlanLimits
  subscription: SubscriptionRow | null
}

// Pro entitlement is derived here rather than trusting the stored `plan` column:
// a subscription grants Pro only while it's active/trialing AND its paid period
// hasn't elapsed. The period-end guard means a missed `subscription.deleted`
// webhook can't leave a user on Pro indefinitely.
export function isProEntitled(sub: SubscriptionRow | null): boolean {
  if (!sub) return false
  if (sub.status !== 'active' && sub.status !== 'trialing') return false
  if (
    sub.current_period_end &&
    new Date(sub.current_period_end).getTime() <= Date.now()
  ) {
    return false
  }
  return true
}

export function getEntitlement(sub: SubscriptionRow | null): Entitlement {
  const plan: Plan = isProEntitled(sub) ? 'pro' : 'free'
  return { plan, limits: PLAN_LIMITS[plan], subscription: sub }
}

export async function getUserEntitlement(userId: string): Promise<Entitlement> {
  const { data } = await getSupabase()
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<SubscriptionRow>()

  return getEntitlement(data ?? null)
}
