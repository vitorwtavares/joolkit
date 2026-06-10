import { getSupabase } from '../middleware/auth'
import { getStripe } from './stripe'

// Cancel the user's Stripe subscription immediately so a deleted account stops
// being billed. No-op when there's nothing live to cancel. Throws on Stripe
// failure so the caller can avoid orphaning a paying subscription with no account.
export async function cancelActiveSubscription(userId: string): Promise<void> {
  const { data } = await getSupabase()
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', userId)
    .maybeSingle<{
      stripe_subscription_id: string | null
      status: string | null
    }>()

  const subId = data?.stripe_subscription_id
  if (!subId) return
  if (data?.status === 'canceled' || data?.status === 'incomplete_expired') {
    return
  }

  await getStripe().subscriptions.cancel(subId)
}
