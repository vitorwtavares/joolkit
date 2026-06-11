import { Router } from 'express'
import { getSupabase } from '../../middleware/auth'
import { getStripe } from '../../billing/stripe'
import { getOrCreateCustomer } from '../../billing/customer'
import { getUserEntitlement } from '../../billing/entitlement'
import { getUsageBreakdown } from '../../billing/usage'

const router = Router()

// Where Stripe sends the user back; the billing page is added in the client stage.
const BILLING_RETURN_PATH = '/settings/billing'

function priceForInterval(interval: unknown): string | undefined {
  if (interval === 'monthly') return process.env.STRIPE_PRICE_PRO_MONTHLY
  if (interval === 'quarterly') return process.env.STRIPE_PRICE_PRO_QUARTERLY
  return undefined
}

// GET /api/billing/status — plan, limits, per-resource active usage + hidden
// (archived) counts, and a safe subscription summary.
router.get('/status', async (req, res) => {
  const [ent, usage] = await Promise.all([
    getUserEntitlement(req.userId!),
    getUsageBreakdown(req.userId!),
  ])
  const sub = ent.subscription

  res.json({
    plan: ent.plan,
    limits: ent.limits,
    usage: usage.active,
    hidden: usage.archived,
    subscription: sub
      ? {
          status: sub.status,
          billing_interval: sub.billing_interval,
          currency: sub.currency,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
        }
      : null,
  })
})

// POST /api/billing/checkout — start a subscription Checkout for the chosen interval.
router.post('/checkout', async (req, res) => {
  const priceId = priceForInterval(req.body?.interval)
  if (!priceId) {
    res.status(400).json({ error: 'Invalid billing interval' })
    return
  }

  // Guard against creating a duplicate subscription for an already-Pro user
  // (stale tab, double-submit). They manage an existing plan via the portal.
  const entitlement = await getUserEntitlement(req.userId!)
  if (entitlement.plan === 'pro') {
    res.status(409).json({ error: 'Already subscribed' })
    return
  }

  const appUrl = process.env.APP_URL ?? ''
  try {
    const customerId = await getOrCreateCustomer(req.userId!)
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}${BILLING_RETURN_PATH}?checkout=success`,
      cancel_url: `${appUrl}${BILLING_RETURN_PATH}?checkout=cancelled`,
      allow_promotion_codes: true,
      subscription_data: { metadata: { user_id: req.userId! } },
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout session creation failed', err)
    res.status(500).json({ error: 'Could not start checkout' })
  }
})

// POST /api/billing/portal — open the Stripe Customer Portal for managing billing.
router.post('/portal', async (req, res) => {
  const { data } = await getSupabase()
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', req.userId!)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  if (!data?.stripe_customer_id) {
    res.status(400).json({ error: 'No billing account found' })
    return
  }

  const appUrl = process.env.APP_URL ?? ''
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${appUrl}${BILLING_RETURN_PATH}`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Portal session creation failed', err)
    res.status(500).json({ error: 'Could not open billing portal' })
  }
})

export default router
