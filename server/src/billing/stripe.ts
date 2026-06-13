import Stripe from 'stripe'

// Resolution-agnostic client type: the stripe SDK's namespace shape differs
// between its CJS and ESM typings, so derive the instance type from the
// constructor instead of referencing a namespace member.
type StripeClient = InstanceType<typeof Stripe>

let stripe: StripeClient | undefined

// Lazy init so the app boots (and tests run) without Stripe configured; the
// client is only required once a billing route is actually hit.
export function getStripe(): StripeClient {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('Missing required env var: STRIPE_SECRET_KEY')
    }
    stripe = new Stripe(key)
  }
  return stripe
}
