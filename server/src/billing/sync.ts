import { getSupabase } from '../middleware/auth'
import { getStripe } from './stripe'
import type {
  StripePriceLike,
  StripeSubscriptionLike,
  StripeCustomerLike,
} from './types'

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
        current_period_end: item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    console.error('Failed to sync subscription', error)
    throw new Error(error.message)
  }
}
