import type { Request, Response } from 'express'
import { getStripe } from '../../billing/stripe'
import { getSupabase } from '../../middleware/auth'
import { syncSubscriptionFromStripe } from '../../billing/sync'
import type {
  StripeEventLike,
  StripeSubscriptionLike,
} from '../../billing/types'

async function processEvent(event: StripeEventLike): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as {
        subscription: string | { id: string } | null
      }
      if (session.subscription) {
        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id
        const sub = (await getStripe().subscriptions.retrieve(
          subId,
        )) as unknown as StripeSubscriptionLike
        await syncSubscriptionFromStripe(sub)
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      // Re-fetch instead of trusting the event payload: Stripe doesn't guarantee
      // delivery order, so retrieving converges to current truth even if an
      // older event arrives late. (A canceled subscription is still retrievable.)
      const obj = event.data.object as { id: string }
      const sub = (await getStripe().subscriptions.retrieve(
        obj.id,
      )) as unknown as StripeSubscriptionLike
      await syncSubscriptionFromStripe(sub)
      break
    }
    default:
      break
  }
}

// Mounted with express.raw() BEFORE the global express.json(), so req.body is the
// raw Buffer Stripe needs for signature verification. Not behind authMiddleware —
// the signature is the auth.
export async function handleStripeWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    res.status(500).send('Webhook not configured')
    return
  }

  const signature = req.headers['stripe-signature']
  let event: StripeEventLike
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      signature as string,
      secret,
    ) as unknown as StripeEventLike
  } catch (err) {
    console.error('Webhook signature verification failed', err)
    res.status(400).send('Invalid signature')
    return
  }

  // Idempotency: skip events we've already processed (Stripe re-delivers).
  const { data: seen } = await getSupabase()
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()
  if (seen) {
    res.json({ received: true })
    return
  }

  try {
    await processEvent(event)
  } catch (err) {
    // Don't record the event — a 500 makes Stripe retry, and our handlers are
    // idempotent (upsert), so reprocessing is safe.
    console.error(`Error handling Stripe event ${event.type}`, err)
    res.status(500).send('Handler error')
    return
  }

  // Mark processed. A duplicate insert (concurrent delivery) is harmless to ignore.
  const { error } = await getSupabase()
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })
  if (error && error.code !== '23505') {
    console.error('Failed to record processed Stripe event', error)
  }

  res.json({ received: true })
}
