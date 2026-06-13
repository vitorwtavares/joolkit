import type { RequestHandler } from 'express'
import { getUserEntitlement, type Entitlement } from '../../billing/entitlement'

declare global {
  namespace Express {
    interface Request {
      entitlement?: Entitlement
    }
  }
}

// Resolves the caller's plan + limits once and stashes them on the request so
// capped routes can enforce creation/visibility limits without each handler
// re-querying the subscription. Mount after authMiddleware.
export const entitlementMiddleware: RequestHandler = async (req, res, next) => {
  try {
    req.entitlement = await getUserEntitlement(req.userId!)
    next()
  } catch (err) {
    console.error('Failed to resolve entitlement', err)
    res.status(500).json({ error: 'Could not resolve plan' })
  }
}
