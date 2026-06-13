import { Router } from 'express'
import { getDisplayCurrency } from '../../billing/geo'

const router = Router()

// Public, unauthenticated: lets the marketing/landing page localise its pricing
// display before sign-up. Same Vercel-header logic as the in-app upgrade modal.
router.get('/', (req, res) => {
  res.json({ currency: getDisplayCurrency(req) })
})

export default router
