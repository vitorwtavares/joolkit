import { getSupabase } from '../middleware/auth'
import { getStripe } from './stripe'
import { isProEntitled, type SubscriptionRow } from './entitlement'
import { applyPlanTransition } from './archive'
import type {
  StripePriceLike,
  StripeSubscriptionLike,
  StripeCustomerLike,
} from './types'

// Entitlement only reads status + current_period_end, so a partial row is enough
// to decide Pro/Free on either side of a sync.
function proFrom(
  status: string | null,
  currentPeriodEnd: string | null,
): boolean {
  return isProEntitled({
    status,
    current_period_end: currentPeriodEnd,
  } as SubscriptionRow)
}

// Our two prices are month/1 and month/3; anything else maps to null.
function billingIntervalFrom(price: StripePriceLike): string | null {
  const r = price.recurring
  if (!r) return null
  if (r.interval === 'month' && r.interval_count === 1) return 'monthly'
  if (r.interval === 'month' && r.interval_count === 3) return 'quarterly'
  return null
}

// Map a Stripe customer back to our user. Prefer the row we wrote at customer
// creation; fall back to the customer's metadata (also set at creation) so a
// webhook that races ahead of that write can still resolve.
async function resolveUserId(customerId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle<{ user_id: string }>()
  if (data?.user_id) return data.user_id

  const customer = (await getStripe().customers.retrieve(
    customerId,
  )) as unknown as StripeCustomerLike
  if (!customer.deleted && customer.metadata?.user_id) {
    return customer.metadata.user_id
  }
  return null
}

// Upsert our subscriptions row from a Stripe Subscription. Idempotent: safe to
// call from any subscription webhook or after Checkout.
export async function syncSubscriptionFromStripe(
  subscription: StripeSubscriptionLike,
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  const userId = await resolveUserId(customerId)
  if (!userId) {
    console.error(
      `Could not map Stripe customer ${customerId} to a user; skipping sync`,
    )
    return
  }

  const item = subscription.items.data[0]
  const price = item?.price
  const isActive =
    subscription.status === 'active' || subscription.status === 'trialing'
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null

  // Capture the prior entitlement before we overwrite it, so we can detect a
  // Pro↔Free crossing and archive/restore data accordingly.
  const { data: prior } = await getSupabase()
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle<{ status: string | null; current_period_end: string | null }>()
  const wasPro = proFrom(
    prior?.status ?? null,
    prior?.current_period_end ?? null,
  )

  const { error } = await getSupabase()
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: price?.id ?? null,
        plan: isActive ? 'pro' : 'free',
        status: subscription.status,
        billing_interval: price ? billingIntervalFrom(price) : null,
        currency: subscription.currency,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    console.error('Failed to sync subscription', error)
    throw new Error(error.message)
  }

  // Archive overflow on downgrade / restore it on resubscribe. Runs after the
  // subscription write so a failure here (which throws and 500s the webhook for
  // Stripe to retry) can't leave the row unwritten; both paths are idempotent.
  const isPro = proFrom(subscription.status, currentPeriodEnd)
  await applyPlanTransition(userId, wasPro, isPro)
}
