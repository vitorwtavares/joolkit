import { getSupabase } from '../middleware/auth'
import { getStripe } from './stripe'

// Get the user's Stripe customer id, creating the customer (and persisting the
// mapping) on first use. user_id is stamped on the customer's metadata so the
// webhook can resolve it back even before our row is written.
export async function getOrCreateCustomer(userId: string): Promise<string> {
  const { data } = await getSupabase()
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle<{ stripe_customer_id: string | null }>()
  if (data?.stripe_customer_id) return data.stripe_customer_id

  const { data: profile } = await getSupabase()
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle<{ email: string | null }>()

  const customer = await getStripe().customers.create({
    email: profile?.email ?? undefined,
    metadata: { user_id: userId },
  })

  const { error } = await getSupabase().from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('Failed to persist stripe customer mapping', error)
  }

  return customer.id
}
