import type { Request } from 'express'

export type DisplayCurrency = 'usd' | 'brl'

// Best-effort currency for the upgrade UI *before* checkout, derived from Vercel's
// IP-geolocation header. Stripe still makes the authoritative choice from the
// card/billing country at checkout — this only localises what the modal shows.
// `BILLING_DEBUG_CURRENCY` forces a value for local dev, where the header is absent.
export function getDisplayCurrency(req: Request): DisplayCurrency {
  const override = process.env.BILLING_DEBUG_CURRENCY
  if (override === 'brl' || override === 'usd') return override

  const country = String(req.headers['x-vercel-ip-country'] ?? '').toUpperCase()
  return country === 'BR' ? 'brl' : 'usd'
}
